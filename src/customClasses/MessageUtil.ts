import Message from "sap/ui/core/message/Message"
import ManagedObject from "sap/ui/base/ManagedObject";
import { MessageType } from "sap/ui/core/library";
import Component from "sap/ui/core/Component";
import { PMessage } from "../definitions/MessagesFromBackend";

/**
 * @namespace plants.ui.customClasses
 */
export default class MessageUtil extends ManagedObject {
	private static _instance: MessageUtil;
	private _oMessageManager;

	public static getInstance(oContext?: Component): MessageUtil {
		if (!MessageUtil._instance && !oContext) {
			throw new Error("MessageUtil not initialized and no context supplied");
		} else if (MessageUtil._instance && oContext) {
			throw new Error("MessageUtil already initialized");
		} else if (!MessageUtil._instance && oContext) {
			MessageUtil._instance = new MessageUtil(oContext);
		}
		return MessageUtil._instance;
	}

	private constructor(oContext: Component) {
		super();
		// name the MessageManager's model so we can use it in the MessagePopover fragment
		// attach the model to supplied context (component to make it available everywhere)
		this._oMessageManager = sap.ui.getCore().getMessageManager();
		oContext.setModel(this._oMessageManager.getMessageModel(), "messages");
	}

	public addMessageFromBackend(backendMessage: PMessage) {
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