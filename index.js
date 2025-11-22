import express from 'express';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import dotenv from 'dotenv'

dotenv.config()

const jar = new CookieJar();
const session = wrapper(axios.create({ jar, withCredentials: true }));

const app = express();
const PORT = process.env.PORT || 3210;

app.use(express.json());

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

        return res;
    } catch (error) {
        console.error("Erro login:", error);
        throw error;
    }
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

        ticketsJSON.push(newTicket); // <-- agora no lugar certo
    });

    return ticketsJSON;
}

await login();

app.get('/tickets/:customSearchmenu', async (req, res) => {
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
