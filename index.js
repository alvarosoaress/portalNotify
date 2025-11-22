import express from 'express';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import dotenv from 'dotenv'

dotenv.config()

const sessions = new Map();
let session;

const app = express();
const PORT = process.env.PORT || 3210;

app.use(express.json());

async function attemptLogin(user, password, maxAttempts = 3) {
    const existsLogin = sessions.get(user);

    if (existsLogin) {
        session = existsLogin;

        const validLogin = await validateLogin();

        if (validLogin) return true;
    }

    const jar = new CookieJar();
    session = wrapper(axios.create({ jar, withCredentials: true }));

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const url = "https://portaldocliente.praxio.com.br/Home/Entrar";
            const loginData = {
                txtLogin: user,
                txtSenha: password,
                ReturnUrl: ""
            };

            const res = await session.post(url, new URLSearchParams(loginData), {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            sessions.set(user, session);

            return res;
        }
        catch (error) {
            console.error("Erro login:", error);
            return false;
        }
    }
}

async function validateLogin() {
    try {
        const url = "https://portaldocliente.praxio.com.br/Ticket/";

        const res = await session.get(url, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        if (res.config.url.includes('ReturnUrl')) return false;

        return true;
    }
    catch (error) {
        console.error("Erro validateLogin:", error);
        return false;
    }
}

async function login(req, res, next) {
    if (!req.headers['x-user']) return res.status(403).json('Não informado usuário')
    if (!req.headers['x-password']) return res.status(403).json('Não informado senha')

    const user = req.headers['x-user'];
    const password = req.headers['x-password'];

    const loginRes = await attemptLogin(user, password);

    if (!loginRes) return res.status(403).json('Credenciais incorretas.')

    next();
}

async function tickets(customSearchmenu) {
    try {
        const res = await session.post(
            "https://portaldocliente.praxio.com.br/Ticket/indexPartial",
            new URLSearchParams({ customSearchmenu })
        );

        const document = parse(res.data);
        return getCleanTickets(document);

    } catch (error) {
        console.error("Erro tickets:", error);
        throw error;
    }
}

async function getHeaders(document) {
    const headers = document.querySelectorAll(".dxgvHeader_Metropolis");

    const cols = Array.from(headers)
        .map(cell => cell.innerText.replace(/&nbsp;/g, "").replace(/\u00A0/g, "").trim())
        .filter(Boolean);

    return cols;
}

async function getCleanTickets(document) {
    const ticketsRows = document.querySelectorAll(".dxgvDataRow_Metropolis");
    const headers = await getHeaders(document);

    const ticketsJSON = [];

    ticketsRows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const newTicket = {};

        cells.forEach((cell, i) => {
            newTicket[headers[i]] = cell.innerText.trim();
        });

        ticketsJSON.push(newTicket);
    });

    return ticketsJSON;
}

app.get('/tickets/:customSearchmenu', login, async (req, res) => {
    const { customSearchmenu } = req.params;

    try {
        const result = await tickets(customSearchmenu);
        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar tickets" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
