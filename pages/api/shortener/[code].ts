import { NextApiRequest, NextApiResponse } from "next"
import { nanoid } from "nanoid"

import SQLiteClient from "@/app/db/sqlite-client"
import { redirect } from "next/dist/server/api-utils"

const sqliteClient = new SQLiteClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "GET") {            
            const { code } = req.query
            if (!code) {   
                return res.status(400).json({ error: "O campo code é obrigatório." })
            }

            const payload = {
                "code": code as string,
            }

            const response = await sqliteClient.get_url_from_code(payload)

            if (response.length === 0) {
                return res.status(404).json({ error: "URL não encontrada." })
            }

            return res.redirect(301, response["url"])

        } else if (req.method === "POST") {
            const { url } = req.body

            if (!url) {
                return res.status(400).json({ error: "O campo URL é obrigatório." })
            }

            const payload = {
                "url": url,
                "code": nanoid(),
                "created_at": new Date().toISOString(),
                "expired_at": new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }

            await sqliteClient.generate_short_link(payload)

            res.status(200).json(payload)
        } else {
            res.setHeader("Allow", ["POST"]);
            res.status(405).end(`Método ${req.method} não permitido.`)
        }
    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).json({ error: "Erro interno do servidor." })
    }
}