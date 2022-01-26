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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersApi = void 0;
var express = require("express");
var typeorm_1 = require("typeorm");
var user_1 = require("../entity/user");
var amqp = require("amqplib/callback_api");
var app = express.Router();
// Creating the Database connection to the MySQL 
(0, typeorm_1.createConnection)().then(function (db) {
    var userRepository = db.getRepository(user_1.User);
    // Unique AMQP URL to connect to
    amqp.connect('amqps://vhmeuklw:A2l_ngGZuZ85zhbykeiu0pbeRHb9lXov@roedeer.rmq.cloudamqp.com/vhmeuklw', function (error0, connection) {
        if (error0) {
            throw error0;
        }
        // Create the Messaging Channel
        connection.createChannel(function (error1, channel) {
            if (error1) {
                throw error1;
            }
            app.get('/api/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var users;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, userRepository.find()];
                        case 1:
                            users = _a.sent();
                            res.json(users);
                            return [2 /*return*/];
                    }
                });
            }); });
            app.post('/api/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var user, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, userRepository.create(req.body)];
                        case 1:
                            user = _a.sent();
                            return [4 /*yield*/, userRepository.save(user)];
                        case 2:
                            result = _a.sent();
                            channel.sendToQueue('user_created', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            app.get('/api/users/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, userRepository.findOne(req.params.id)];
                        case 1:
                            user = _a.sent();
                            return [2 /*return*/, res.send(user)];
                    }
                });
            }); });
            app.put('/api/users/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var user, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, userRepository.findOne(req.params.id)];
                        case 1:
                            user = _a.sent();
                            userRepository.merge(user, req.body);
                            return [4 /*yield*/, userRepository.save(user)];
                        case 2:
                            result = _a.sent();
                            channel.sendToQueue('user_updated', Buffer.from(JSON.stringify(result)));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
            app.delete('/api/users/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, userRepository.delete(req.params.id)];
                        case 1:
                            result = _a.sent();
                            channel.sendToQueue('user_deleted', Buffer.from(req.params.id));
                            return [2 /*return*/, res.send(result)];
                    }
                });
            }); });
        });
    });
});
exports.usersApi = app;
