import sql from "./db.js";

export async function getTicketByNum(ticketNum) {
    try {
        const result = await sql`SELECT * FROM TICKETS where ticket = ${ticketNum};`;

        return result[0];
    } catch (error) {
        console.error('Error DB getTicketByNum', error)
        return null;
    }
}

export async function getAllTickets() {
    try {
        const result = await sql`SELECT * FROM TICKETS;`;

        return result[0];
    } catch (error) {
        console.error('Error DB getAllTickets', error)
        return null;
    }
}

export async function createTicket(ticketInfo) {
    try {
        const result = await sql`INSERT INTO TICKETS ${sql(ticketInfo, 'ticket', 'title', 'opening', 'client', 'module', 'person')} RETURNING *;`

        return result[0];;
    } catch (error) {
        console.error('Error DB createTicket', error)
        return null;
    }
}

export async function updateTicket(ticketInfo) {
    try {
        const result = await sql`UPDATE TICKETS SET ${sql(ticketInfo, 'last_alert', 'alert_count')} WHERE ticket = ${ticketInfo.ticketNum} RETURNING *;`

        return result[0];
    } catch (error) {
        console.error('Error DB updateTicket', error)
        return null;
    }
}


