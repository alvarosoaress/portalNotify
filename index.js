import express from 'express';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import { createTicket, getTicketByNum, updateTicket } from './service.js';
import { existingCard, newCard } from './adaptiveCard.js';

const jar = new CookieJar();
const session = wrapper(axios.create({ jar, withCredentials: true }));

const app = express();
const PORT = process.env.PORT || 3210;

// Middleware
app.use(express.json());

//! Convertendo para BR timezone -3 horas caso não esteja na timezone -3
const currentDate = new Date().getTimezoneOffset = 180 ? new Date() : new Date(new Date().getTime() - (3600000 * 3))

// Função para verificar se está no horário de funcionamento  
function isWorkingHours() {
    const day = currentDate.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado  
    const hour = currentDate.getHours();

    // Segunda a sexta (1-5) e das 8h às 18h
    const isWeekday = day >= 1 && day <= 5;
    const isWorkingTime = hour >= 8 && hour <= 18;

    console.log(currentDate)

    return isWeekday && isWorkingTime;
}

async function login() {
    try {
        const url = "https://portaldocliente.praxio.com.br/Home/Entrar";
        const loginData = {
            txtLogin: process.env.PORTAL_USER,
            txtSenha: process.env.PORTAL_PASSWORD,
            ReturnUrl: ""
        };

        const res = await session.post(url, new URLSearchParams(loginData), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        console.log("✅ Login status:", res.status);
        return res;
    } catch (error) {
        return error.response;
    }
}

async function tickets(customSearchmenu) {
    try {
        const res = await session.post(
            "https://portaldocliente.praxio.com.br/Ticket/indexPartial",
            new URLSearchParams({ customSearchmenu })
        );

        return res;
    } catch (error) {
        return error.response;
    }
}

// Função para extrair tickets do HTML
function parseTicketsFromHTML(htmlString) {
    try {
        const tickets = [];
        const document = parse(htmlString);
        const ticketsDOM = document.querySelectorAll('.dxgvDataRow_Metropolis');

        ticketsDOM.forEach((ticket) => {
            let team = ticket.childNodes[8].innerText.split(' ')


            tickets.push({
                number: ticket.childNodes[2].innerText,
                link: `https://portaldocliente.praxio.com.br/Ticket/TicketPrincipal/` + ticket.childNodes[2].innerHTML.slice(33, 39),
                title: ticket.childNodes[3].innerText,
                opening: ticket.childNodes[7].innerText,
                team: team[team.length - 1],
                client: ticket.childNodes[9].innerText.slice('&', -6),
                module: ticket.childNodes[10].innerText,
                person: ticket.childNodes[12].innerText.slice('&', -6)
            });
        });

        return tickets;
    } catch (error) {
        console.error('Erro ao fazer parse dos tickets:', error.message);
        return [];
    }
}

// Função para tentar login
async function attemptLogin(attempt = 1) {
    console.log(`Tentativa de login ${attempt}/2...`);

    const loginResponse = await login()

    if (!loginResponse) {
        console.log(`Tentativa ${attempt}: Erro na requisição de login`);
        return false;
    }

    console.log(`Tentativa ${attempt}: Login realizado com sucesso!`);
    return true;
}

// Função para enviar notificação para serviço terceiro
async function sendNotificationToThirdParty(tickets) {
    try {
        console.log('📤 Enviando notificação para Microsoft Teams...');

        // Enviar para o webhook do Power Automate
        const webhookUrl = process.env.WEBHOOKURL;

        // Criar array de promises corretamente
        const promises = tickets.map(async (ticket) => {
            const ticketAlreadySent = await getTicketByNum(ticket.number);

            let adaptiveCardBody = {}

            if (ticketAlreadySent) {
                await updateTicket({ last_alert: currentDate, alert_count: ticketAlreadySent.alert_count + 1, ticketNum: ticket.number })

                adaptiveCardBody = existingCard({ ...ticket, alert_count: ticketAlreadySent.alert_count + 1 })
            } else {
                let newTicketInfo = {
                    ticket: ticket.number,
                    title: ticket.title,
                    opening: new Date(ticket.opening).getTime(),
                    client: ticket.client,
                    module: ticket.module,
                    person: ticket.person
                }

                await createTicket(newTicketInfo)
                adaptiveCardBody = newCard(ticket)
            }

            try {
                const response = await axios.post(webhookUrl, adaptiveCardBody, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 202) {
                    console.log(`✅ Notificação enviada com sucesso para Teams! Ticket: ${ticket.number}`);
                    return { success: true, ticket: ticket.number };
                } else {
                    console.log(`⚠️ Resposta inesperada: ${response.status} para ticket ${ticket.number}`);
                    return { success: false, ticket: ticket.number, status: response.status };
                }
            } catch (error) {
                console.error(`❌ Erro ao enviar ticket ${ticket.number}:`, error.message);
                return { success: false, ticket: ticket.number, error: error.message };
            }
        });

        // Aguardar todas as promises
        const results = await Promise.all(promises);

        const failed = results.filter(r => !r.success);

        if (failed.length > 0) {
            console.log('❌ Tickets que falharam:', failed.map(f => f.ticket));
        }

    } catch (error) {
        console.error('❌ Erro geral ao enviar notificações para Teams:', error.message);
    }
}

// Função principal do bot
async function checkApiAndNotify() {
    if (!isWorkingHours()) return

    try {
        // console.log('=== Verificando API ===');

        const ticketResponse = await tickets('27419')

        // Se status for 200, processa os tickets
        if (ticketResponse && ticketResponse.status === 200 && ticketResponse.data.length > 15000) {
            // console.log('✅ Status 200 - Processando tickets...');

            // Usar a response como HTMLString
            const htmlString = ticketResponse.data;

            // Extrair tickets do HTML
            const tickets = parseTicketsFromHTML(htmlString);

            if (tickets.length > 0) {
                console.log(`🎫 Tickets encontrados: ${tickets.length}`);
                console.log('📋 Lista de tickets:');
                tickets.forEach((ticket, index) => {
                    console.log(`  ${index + 1}. ${ticket.number} - ${ticket.title}`);
                });

                await sendNotificationToThirdParty(tickets);
            } else {
                // console.log('ℹ️  Nenhum ticket encontrado no HTML');
            }

        } else {
            // console.log('IndexPartial não retornou, tentando fazer login...');

            // Primeira tentativa de login
            let loginSuccess = await attemptLogin(1);

            if (!loginSuccess) {
                // console.log('Primeira tentativa falhou, tentando novamente...');
                loginSuccess = await attemptLogin(2);
            }

            if (loginSuccess) {
                console.log('✅ Login realizado com sucesso após tentativas!');
                // Após login bem-sucedido, pode tentar buscar tickets novamente
                console.log('🔄 Tentando buscar tickets após login...');
                await checkApiAndNotify();
                return;
            } else {
                console.error('❌ ERRO: Login falhou após 2 tentativas!');
                console.error('🚨 NOTIFICAÇÃO: Falha no sistema de login!');
            }
        }

        // console.log('=== Verificação concluída ===\n');

    } catch (error) {
        console.error('❌ Erro geral no bot:', error.message);
    }
}

// // Rota para testar manualmente
// app.get('/check', async (req, res) => {
//     await checkApiAndNotify();
//     res.json({ message: 'Verificação executada' });
// });

// // Rota para testar apenas o login
// app.get('/test-login', async (req, res) => {
//     console.log('=== Teste de Login Manual ===');
//     const success = await attemptLogin(1);
//     res.json({
//         message: 'Teste de login executado',
//         success: success
//     });
// });

// // Rota para testar parsing de HTML (para debug)
// app.post('/test-parse', express.text({ type: 'text/html' }), (req, res) => {
//     const htmlString = req.body;
//     const tickets = parseTicketsFromHTML(htmlString);
//     res.json({
//         message: 'Parse testado',
//         ticketCount: tickets.length,
//         tickets: tickets
//     });
// });

// Rota de health check
app.get('/', async (req, res) => {
    res.json({ message: 'Bot está rodando!' });

    // const result = await pool.query('SELECT * FROM TICKETS where ticket = ($1)', [ticket]);

    res.status(200).json(result.rows);
});

// Executar verificação a cada 5 minutos (300000ms)
setInterval(checkApiAndNotify, 300000);

// Executar uma vez ao iniciar
checkApiAndNotify();

app.listen(PORT, async () => {
    console.log(`Bot rodando na porta ${PORT}`);

    // console.log(`Acesse http://localhost:${PORT}/check para testar manualmente`);
    // console.log(`Acesse http://localhost:${PORT}/test-login para testar apenas o login`);
    // console.log(`POST http://localhost:${PORT}/test-parse para testar parsing HTML`);
});