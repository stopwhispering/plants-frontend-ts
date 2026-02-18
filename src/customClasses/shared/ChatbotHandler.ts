import BaseController from "plants/ui/controller/BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import Fragment from "sap/ui/core/Fragment";
import Dialog from "sap/m/Dialog";
import ScrollContainer from "sap/m/ScrollContainer";
import TextArea from "sap/m/TextArea";
import MessageToast from "sap/m/MessageToast";
import Constants from "plants/ui/Constants";
import Navigation from "plants/ui/customClasses/singleton/Navigation";
import Button, { Button$PressEvent } from "sap/m/Button";

interface IChatMessage {
	role: "user" | "bot";
	text: string;
	timestamp: string;
	plant_ids?: number[];
}

interface IChatbotModel {
	messages: IChatMessage[];
	currentMessage: string;
	isTyping: boolean;
	sessionId: string | null;
}

// Backend request/response types
interface IChatRequest {
	message: string;
	session_id?: string;
}

interface IChatResponse {
	session_id: string;
	reply: string;
	history: IChatMessage[];
    reasoning: string;
    plant_ids: number[];
}

/**
 * Handler for the chatbot dialog
 * Manages the chatbot UI and interactions
 * Backend connection to be implemented later
 * 
 * @namespace plants.ui.customClasses.shared
 */
export default class ChatbotHandler {
	private oController: BaseController;
	private oDialog: Dialog | null = null;
	private oChatbotModel: JSONModel;

	constructor(oController: BaseController) {
		this.oController = oController;
		this._initializeModel();
	}

	/**
	 * Initialize the chatbot model with default data
	 */
	private _initializeModel(): void {
		const oData: IChatbotModel = {
			messages: [
				{
					role: "bot",
					text: "Hello! I'm your Plant Assistant. I can help you with information about your plants. How can I help you today?",
					timestamp: this._getFormattedTime()
				}
			],
			currentMessage: "",
			isTyping: false,
			sessionId: null
		};

		this.oChatbotModel = new JSONModel(oData);
		this.oController.getView()?.setModel(this.oChatbotModel, "chatbot");
	}

	/**
	 * Open the chatbot dialog
	 */
	public async open(): Promise<void> {
		if (!this.oDialog) {
			const oView = this.oController.getView();
			if (!oView) return;

			this.oDialog = await Fragment.load({
				id: oView.getId(),
				name: "plants.ui.view.fragments.ChatbotDialog",
				controller: this.oController
			}) as Dialog;

			oView.addDependent(this.oDialog);
		}

		this.oDialog.open();
		
		// Scroll to bottom after dialog opens
		setTimeout(() => {
			this._scrollToBottom();
		}, 100);
	}

	/**
	 * Close the chatbot dialog
	 */
	public close(): void {
		this.oDialog?.close();
	}

	/**
	 * Send a message from the user
	 */
	public sendMessage(): void {
		const sMessage = this.oChatbotModel.getProperty("/currentMessage")?.trim();
		
		if (!sMessage) {
			return;
		}

		// Add user message
		const aMessages: IChatMessage[] = this.oChatbotModel.getProperty("/messages");
		aMessages.push({
			role: "user",
			text: sMessage,
			timestamp: this._getFormattedTime()
		});

		this.oChatbotModel.setProperty("/messages", aMessages);
		this.oChatbotModel.setProperty("/currentMessage", "");

		// Clear the input field
		const oView = this.oController.getView();
		const oInputField = oView?.byId("chatInputField") as TextArea;
		if (oInputField) {
			oInputField.setValue("");
		}

		this._scrollToBottom();

		// Send message to backend
		this._sendMessageToBackend(sMessage);
	}

	/**
	 * Send message to backend API and handle response
	 */
	private async _sendMessageToBackend(userMessage: string): Promise<void> {
		// Show typing indicator
		this.oChatbotModel.setProperty("/isTyping", true);

		try {
			const sessionId = this.oChatbotModel.getProperty("/sessionId");
			const requestBody: IChatRequest = {
				message: userMessage
			};

			// Include session_id if we have one
			if (sessionId) {
				requestBody.session_id = sessionId;
			}

			// Call backend API
			const response = await fetch(Constants.base_url + "chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
			}

			const data: IChatResponse = await response.json();

			// Store session_id for next request
			this.oChatbotModel.setProperty("/sessionId", data.session_id);

			// Add bot's response to messages
			const aMessages: IChatMessage[] = this.oChatbotModel.getProperty("/messages");
			aMessages.push({
				role: "bot",
				text: data.reply,
				timestamp: this._getFormattedTime(),
				plant_ids: data.plant_ids
			});

			this.oChatbotModel.setProperty("/messages", aMessages);
			this.oChatbotModel.setProperty("/isTyping", false);

			this._scrollToBottom();

		} catch (error) {
			console.error("Error calling chatbot backend:", error);
			
			// Show error message to user
			const aMessages: IChatMessage[] = this.oChatbotModel.getProperty("/messages");
			aMessages.push({
				role: "bot",
				text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
				timestamp: this._getFormattedTime()
			});

			this.oChatbotModel.setProperty("/messages", aMessages);
			this.oChatbotModel.setProperty("/isTyping", false);

			MessageToast.show("Failed to send message to chatbot backend");
			
			this._scrollToBottom();
		}
	}

	/**
	 * Clear all chat messages and start new session
	 */
	public clearChat(): void {
		const oData: IChatbotModel = {
			messages: [
				{
					role: "bot",
					text: "Chat cleared. How can I help you?",
					timestamp: this._getFormattedTime()
				}
			],
			currentMessage: "",
			isTyping: false,
			sessionId: null  // Reset session to start fresh
		};

		this.oChatbotModel.setData(oData);
		this._scrollToBottom();
	}

	/**
	 * Scroll to the bottom of the chat container
	 */
	private _scrollToBottom(): void {
		setTimeout(() => {
			const oView = this.oController.getView();
			const oScrollContainer = oView?.byId("chatMessagesContainer") as ScrollContainer;
			
			if (oScrollContainer) {
				// Scroll to maximum height
				const iScrollHeight = oScrollContainer.$()[0]?.scrollHeight || 0;
				oScrollContainer.scrollTo(0, iScrollHeight, 200);
			}
		}, 50);
	}

	/**
	 * Get formatted current time
	 */
	private _getFormattedTime(): string {
		const now = new Date();
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	/**
	 * Destroy the dialog and clean up resources
	 */
	public destroy(): void {
		if (this.oDialog) {
			this.oDialog.destroy();
			this.oDialog = null;
		}
	}

	/**
	 * Handle plant ID button press to navigate to plant details
	 */
	public onPlantIdButtonPress(oEvent: Button$PressEvent): void {
        console.warn("Plant ID button pressed", oEvent);
		const oButton = oEvent.getSource() as Button;
		const oBindingContext = oButton.getBindingContext("chatbot");
		if (oBindingContext) {
			const iPlantId = oBindingContext.getObject() as number;
			Navigation.getInstance().navToPlantDetails(iPlantId);
			// Optionally close the chatbot dialog after navigation
			this.close();
		}
	}
}
