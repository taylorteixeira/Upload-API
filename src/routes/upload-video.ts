import { FastifyInstance } from "fastify";
import { fastifyMultipart } from "@fastify/multipart";
import { prisma } from "../lib/prisma";
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs"
import { pipeline } from "node:stream";
import { promisify } from "node:util";

const pump = promisify(pipeline)


export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart, {
    limits: {
      fileSize: 1_048576 * 25, //25mb
    },
  })

  app.post("/videos", async (request, replay) => {
    const data = await request.file()

    if(!data) {
      return replay.status(400).send({error: 'missing file input'})
    }

    const extension = path.extname(data.filename)

    if(extension != 'mp3'){
      return replay.status(400).send({ error: "Invalisd input type, please upload mp3 " })
    }

    const fileBaseName = path.basename(data.filename, extension)
    const fileUploadNmame = `${fileBaseName}-${randomUUID()}${extension}`

    const uploadDestination = path.resolve(__dirname, '../../tmp',fileUploadNmame)

    await pump(data.file, fs.createWriteStream(uploadDestination))

    const video =  await prisma.video.create({
      data: {
        nome: data.filename,
        path: uploadDestination,
      }
    })

    return{
      video,
    }
  })
}  
