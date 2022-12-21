sap.ui.define(["sap/ui/core/message/Message", "sap/ui/base/ManagedObject", "sap/ui/core/library"], function (Message, ManagedObject, sap_ui_core_library) {
  const MessageType = sap_ui_core_library["MessageType"];
  /**
   * @namespace plants.ui.customClasses
   */
  const MessageUtil = ManagedObject.extend("plants.ui.customClasses.MessageUtil", {
    constructor: function _constructor(oContext) {
      ManagedObject.prototype.constructor.call(this);
      // name the MessageManager's model so we can use it in the MessagePopover fragment
      // attach the model to supplied context (component to make it available everywhere)
      this._oMessageManager = sap.ui.getCore().getMessageManager();
      oContext.setModel(this._oMessageManager.getMessageModel(), "messages");
    },
    addMessageFromBackend: function _addMessageFromBackend(backendMessage) {
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
    },
    addMessage: function _addMessage(sType, sMessage, sAdditionalText, sDescription) {
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
    },
    removeAllMessages: function _removeAllMessages() {
      this._oMessageManager.removeAllMessages();
    }
  });
  MessageUtil.getInstance = function getInstance(oContext) {
    if (!MessageUtil._instance && !oContext) {
      throw new Error("MessageUtil not initialized and no context supplied");
    } else if (MessageUtil._instance && oContext) {
      throw new Error("MessageUtil already initialized");
    } else if (!MessageUtil._instance && oContext) {
      MessageUtil._instance = new MessageUtil(oContext);
    }
    return MessageUtil._instance;
  };
  return MessageUtil;
});
//# sourceMappingURL=MessageUtil.js.map