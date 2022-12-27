import Message from "sap/ui/core/message/Message"
import ManagedObject from "sap/ui/base/ManagedObject";
import { MessageType } from "sap/ui/core/library";
import Component from "sap/ui/core/Component";
import { BMessage } from "../definitions/Messages";

/**
 * @namespace plants.ui.customClasses
 */
export default class MessageHandler extends ManagedObject {
	private static _instance: MessageHandler;
	private _oMessageManager;

	public static getInstance(oContext?: Component): MessageHandler {
		if (!MessageHandler._instance && !oContext) {
			throw new Error("MessageHandler not initialized and no context supplied");
		} else if (MessageHandler._instance && oContext) {
			throw new Error("MessageHandler already initialized");
		} else if (!MessageHandler._instance && oContext) {
			MessageHandler._instance = new MessageHandler(oContext);
		}
		return MessageHandler._instance;
	}

	private constructor(oContext: Component) {
		super();
		// name the MessageManager's model so we can use it in the MessagePopover fragment
		// attach the model to supplied context (component to make it available everywhere)
		this._oMessageManager = sap.ui.getCore().getMessageManager();
		oContext.setModel(this._oMessageManager.getMessageModel(), "messages");
	}

	public addMessageFromBackend(backendMessage: BMessage) {
		// wrapper with only one parameter, just adding a message from frontend as is into 
		// message model; exception: debug messages are not inserted
		if (backendMessage.type !== 'Debug') {
			var oMessage = new Message({
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
	}

	public addMessage(sType: MessageType, sMessage: string, sAdditionalText?: string, sDescription?: string) {
		if (sType === 'Error') {
			sType = MessageType.Error;
		}
		var oMessage = new Message({
			type: sType,
			message: sMessage,
			additionalText: sAdditionalText,
			description: sDescription
		});
		this._oMessageManager.addMessages(oMessage);
	}

	public removeAllMessages() {
		this._oMessageManager.removeAllMessages();
	}
} 