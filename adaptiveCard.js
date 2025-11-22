export function newCard(ticket) {
    const card = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "type": "AdaptiveCard",
                    "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
                    "version": "1.5",
                    "msteams": {
                        "width": "full",
                        "teamTag": `${ticket.team}`
                    },
                    "body": [
                        {
                            "type": "Container",
                            "style": "good",
                            "items": [
                                {
                                    "type": "ColumnSet",
                                    "columns": [
                                        {
                                            "type": "Column",
                                            "width": "auto",
                                            "items": [
                                                {
                                                    "type": "Image",
                                                    "url": "https://img.icons8.com/color/48/000000/ticket.png",
                                                    "size": "Small",
                                                    "altText": "Ticket Icon"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "Column",
                                            "width": "stretch",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "🎫 Novo Ticket !",
                                                    "weight": "Bolder",
                                                    "size": "Large",
                                                    "color": "Default"
                                                },
                                                {
                                                    "type": "TextBlock",
                                                    "isSubtle": true,
                                                    "spacing": "None",
                                                    "text": `${ticket.title}`
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "type": "Container",
                            "spacing": "Medium",
                            "items": [
                                {
                                    "type": "FactSet",
                                    "facts": [
                                        {
                                            "title": "Número:",
                                            "value": `${ticket.number}`
                                        },
                                        {
                                            "title": "Título:",
                                            "value": `${ticket.title}`
                                        },
                                        {
                                            "title": "Módulo:",
                                            "value": `${ticket.module}`
                                        },
                                        {
                                            "title": "Cliente:",
                                            "value": `${ticket.client}`
                                        },
                                        {
                                            "title": "Responsável:",
                                            "value": `${ticket.person}`
                                        },
                                        {
                                            "title": "Abertura:",
                                            "value": `${ticket.opening}`
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "type": "Container",
                            "spacing": "Medium",
                            "style": "default",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "text": `Última verificação: ${new Date().toLocaleString('pt-BR')}`,
                                    "isSubtle": true,
                                    "size": "Small",
                                    "spacing": "None"
                                }
                            ]
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "🔗 Abrir Ticket",
                            "url": `${ticket.link}`,
                            "style": "positive"
                        }
                    ]
                }
            }
        ]
    };

    return card
}

export function existingCard(ticket) {
    const card = {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "type": "AdaptiveCard",
                    "$schema": "https://adaptivecards.io/schemas/adaptive-card.json",
                    "version": "1.5",
                    "msteams": {
                        "width": "full",
                        "teamTag": `${ticket.team}`
                    },
                    "body": [
                        {
                            "type": "Container",
                            "style": "attention",
                            "items": [
                                {
                                    "type": "ColumnSet",
                                    "columns": [
                                        {
                                            "type": "Column",
                                            "width": "auto",
                                            "items": [
                                                {
                                                    "type": "Image",
                                                    "url": "https://img.icons8.com/color/48/000000/ticket.png",
                                                    "size": "Small",
                                                    "altText": "Ticket Icon"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "Column",
                                            "width": "stretch",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "🎫 Ticket ainda em aberto !",
                                                    "weight": "Bolder",
                                                    "size": "Large",
                                                    "color": "Attention"
                                                },
                                                {
                                                    "type": "TextBlock",
                                                    "isSubtle": true,
                                                    "spacing": "None",
                                                    "text": `${ticket.title}`
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "type": "Container",
                            "spacing": "Medium",
                            "items": [
                                {
                                    "type": "FactSet",
                                    "facts": [
                                        {
                                            "title": "Número:",
                                            "value": `${ticket.number}`
                                        },
                                        {
                                            "title": "Título:",
                                            "value": `${ticket.title}`
                                        },
                                        {
                                            "title": "Módulo:",
                                            "value": `${ticket.module}`
                                        },
                                        {
                                            "title": "Cliente:",
                                            "value": `${ticket.client}`
                                        },
                                        {
                                            "title": "Responsável:",
                                            "value": `${ticket.person}`
                                        },
                                        {
                                            "title": "Abertura:",
                                            "value": `${ticket.opening}`
                                        },
                                        {
                                            "title": "Avisos:",
                                            "value": `${ticket.alert_count}`
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "type": "Container",
                            "spacing": "Medium",
                            "style": "default",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "text": `Última verificação: ${new Date().toLocaleString('pt-BR')}`,
                                    "isSubtle": true,
                                    "size": "Small",
                                    "spacing": "None"
                                }
                            ]
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "🔗 Abrir Ticket",
                            "url": `${ticket.link}`,
                            "style": "positive"
                        }
                    ]
                }
            }
        ]
    };

    return card
}

