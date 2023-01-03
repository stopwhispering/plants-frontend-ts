"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var Message_1 = require("sap/ui/core/message/Message");
var ManagedObject_1 = require("sap/ui/base/ManagedObject");
var library_1 = require("sap/ui/core/library");
/**
 * @namespace plants.ui.customClasses.singleton
 */
var MessageHandler = /** @class */ (function (_super) {
    __extends(MessageHandler, _super);
    function MessageHandler() {
        var _this = _super.call(this) || this;
        // name the MessageManager's model so we can use it in the MessagePopover fragment
        // attach the model to supplied context (component to make it available everywhere)
        _this._oMessageManager = sap.ui.getCore().getMessageManager();
        return _this;
        // oContext.setModel(this._oMessageManager.getMessageModel(), "messages");
    }
    MessageHandler.createInstance = function () {
        if (MessageHandler._instance)
            throw new Error("MessageHandler already initialized.");
        MessageHandler._instance = new MessageHandler();
    };
    MessageHandler.getInstance = function () {
        if (!MessageHandler._instance)
            throw new Error("MessageHandler not initialized, yet.");
        return MessageHandler._instance;
    };
    MessageHandler.prototype.getMessageManager = function () {
        return this._oMessageManager;
    };
    MessageHandler.prototype.addMessageFromBackend = function (backendMessage) {
        // wrapper with only one parameter, just adding a message from frontend as is into 
        // message model; exception: debug messages are not inserted
        if (backendMessage.type !== 'Debug') {
            var oMessage = new Message_1["default"]({
                type: backendMessage.type,
                message: backendMessage.message,
                additionalText: backendMessage.additionalText,
                description: backendMessage.description
            });
            this._oMessageManager.addMessages(oMessage);
        }
        // sap.base.Log is unusable as the default lib spams the console with ui5 debug entries
        // Log.debug(dictMessage.message);
        console.log(backendMessage.message);
    };
    MessageHandler.prototype.addMessage = function (sType, sMessage, sAdditionalText, sDescription) {
        if (sType === 'Error') {
            sType = library_1.MessageType.Error;
        }
        var oMessage = new Message_1["default"]({
            type: sType,
            message: sMessage,
            additionalText: sAdditionalText,
            description: sDescription
        });
        this._oMessageManager.addMessages(oMessage);
    };
    MessageHandler.prototype.removeAllMessages = function () {
        this._oMessageManager.removeAllMessages();
    };
    return MessageHandler;
}(ManagedObject_1["default"]));
exports["default"] = MessageHandler;
