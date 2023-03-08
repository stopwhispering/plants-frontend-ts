import Message from "sap/ui/core/message/Message"
import ManagedObject from "sap/ui/base/ManagedObject";
import { MessageType } from "sap/ui/core/library";
import { BMessage } from "plants/ui/definitions/Messages";

/**
 * @namespace plants.ui.customClasses.singleton
 */
export default class MessageHandler extends ManagedObject {
	private static _instance: MessageHandler;
	private _oMessageManager;

	public static createInstance(): void {
		if (MessageHandler._instance)
			throw new Error("MessageHandler already initialized.");
		MessageHandler._instance = new MessageHandler();
	}

	public static getInstance(): MessageHandler {
		if (!MessageHandler._instance)
			throw new Error("MessageHandler not initialized, yet.");
		return MessageHandler._instance;
	}

	private constructor() {
		super();
		// name the MessageManager's model so we can use it in the MessagePopover fragment
		// attach the model to supplied context (component to make it available everywhere)
		this._oMessageManager = sap.ui.getCore().getMessageManager();
		// oContext.setModel(this._oMessageManager.getMessageModel(), "messages");
	}

	public getMessageManager() {
		return this._oMessageManager;
	} 

	public addMessageFromBackend(backendMessage: BMessage) {
		// wrapper with only one parameter, just adding a message from frontend as is into 
		// message model; exception: debug messages are not inserted
		if (backendMessage.type !== 'Debug') {
			var oMessage = new Message({
				type: backendMessage.type,
				message: backendMessage.message,
				description: backendMessage.description
			});
			this._oMessageManager.addMessages(oMessage);
		}

		// sap.base.Log is unusable as the default lib spams the console with ui5 debug entries
		// Log.debug(dictMessage.message);
		console.log(backendMessage.message);
	}

	public addMessage(sType: MessageType, sMessage: string, sDescription?: string) {
		if (sType === 'Error') {
			sType = MessageType.Error;
		}
		var oMessage = new Message({
			type: sType,
			message: sMessage,
			description: sDescription
		});
		this._oMessageManager.addMessages(oMessage);
	}

	public removeAllMessages() {
		this._oMessageManager.removeAllMessages();
	}
} 