import express from "express"
import cors from "cors"
import simpleGit from "simple-git"
import { generate } from "./generateId"
import path from "path"
import { getAllFiles } from "./getAllFiles"
import { uploadFile } from "./aws"
import { createClient } from "redis"
import { updatestatus } from "./updatestatus"
import { createDeployment } from "./createDeployment"
import { deleteFolder } from "./deleteFolder"
const publisher = createClient()
publisher.connect()
const subscriber = createClient()
subscriber.connect()

const app = express()
app.use(cors())
app.use(express.json())

const parseFile = (filepath : string) => {
    let s = "";
    for(let i=0;i<filepath.length;i++){
        if(filepath[i] === '\\'){
            s += '/'
        } else {
            s += filepath[i]
        }
    }
    return s;
}



app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl
    const email = req.body.email
    const id = generate()
    try {
      //createDeployment  
        await createDeployment(email, repoUrl, id)
        publisher.hSet("status", id, "uploading...")
        await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));

        const files = getAllFiles(path.join(__dirname, `output/${id}`));

        const allPromises = files.map(async (file) => {
            await uploadFile(parseFile(file).slice(__dirname.length + 1), file)
        })

        await Promise.all(allPromises)

        //update status
        await updatestatus(id)
        console.log("deleting files");
            
        await deleteFolder(path.join(__dirname, `output/${id}`))

        publisher.lPush("build-queue", id)
        publisher.hSet("status", id, "uploaded...")

        res.status(200).json({ id })
      } catch (error) {
        console.log("eror : ", error);
        return res.status(500).json({mesage : error})
      }
})

app.post("/redeploy",async (req, res) => {
    const id = req.body.id;
    
    publisher.lPush("redeploy-queue", id)
    console.log(id);
    
    res.json({
        id
    })
})
app.get("/status",async (req, res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string)
    res.json({
        status : response
    })
})

app.listen(3000, () => console.log(`app is running on port : 3000`))