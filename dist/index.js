"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const simple_git_1 = __importDefault(require("simple-git"));
const generateId_1 = require("./generateId");
const path_1 = __importDefault(require("path"));
const getAllFiles_1 = require("./getAllFiles");
const aws_1 = require("./aws");
const redis_1 = require("redis");
const updatestatus_1 = require("./updatestatus");
const createDeployment_1 = require("./createDeployment");
const publisher = (0, redis_1.createClient)();
publisher.connect();
const subscriber = (0, redis_1.createClient)();
subscriber.connect();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const parseFile = (filepath) => {
    let s = "";
    for (let i = 0; i < filepath.length; i++) {
        if (filepath[i] === '\\') {
            s += '/';
        }
        else {
            s += filepath[i];
        }
    }
    return s;
};
app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoUrl = req.body.repoUrl;
    const email = req.body.email;
    const id = (0, generateId_1.generate)();
    try {
        //createDeployment  
        yield (0, createDeployment_1.createDeployment)(email, repoUrl, id);
        publisher.hSet("status", id, "uploading...");
        yield (0, simple_git_1.default)().clone(repoUrl, path_1.default.join(__dirname, `output/${id}`));
        const files = (0, getAllFiles_1.getAllFiles)(path_1.default.join(__dirname, `output/${id}`));
        const allPromises = files.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, aws_1.uploadFile)(parseFile(file).slice(__dirname.length + 1), file);
        }));
        yield Promise.all(allPromises);
        //update status
        yield (0, updatestatus_1.updatestatus)(id);
        publisher.lPush("build-queue", id);
        publisher.hSet("status", id, "uploaded...");
        res.status(200).json({ id });
    }
    catch (error) {
        console.log("eror : ", error);
        return res.status(500).json({ mesage: error });
    }
}));
app.post("/redeploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.body.id;
    publisher.lPush("redeploy-queue", id);
    console.log(id);
    res.json({
        id
    });
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const response = yield subscriber.hGet("status", id);
    res.json({
        status: response
    });
}));
app.listen(3000, () => console.log(`app is running on port : 3000`));
