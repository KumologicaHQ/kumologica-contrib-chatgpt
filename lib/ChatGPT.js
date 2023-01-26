module.exports = function (App) {
  const { KLNode, KLError } = require('@kumologica/devkit');

  class ChatGPTError extends KLError { }

  class ChatGPT extends KLNode {
    constructor(props) {
      super(App, props);
      this.instruction = props.instruction;
      this.image = props.image;
      this.operation = props.operation;
      this.personaltoken =  props.personaltoken;
      this.model = props.model;
      this.maxtoken = props.maxtoken;
      this.noimages = props.noimages;
      this.imagesize = props.imagesize;

      // Method bindings
      this.handle = this.handle.bind(this);
      this.removeEmpty = this.removeEmpty.bind(this);
    }

    async removeEmpty(obj) {
      return Object.keys(obj)
        .filter(function (k) {
          return obj[k] != null;
        })
        .reduce(function (acc, k) {
          acc[k] = typeof obj[k] === "object" ? removeEmpty(obj[k]) : obj[k];
          return acc;
        }, {});
    }

    async handle(msg) {
      
      let Instruction = App.util.evaluateDynamicField(this.instruction, msg, this);
      let Maxtoken = parseInt(App.util.evaluateDynamicField(this.maxtoken, msg, this));
      let NoImages = parseInt(App.util.evaluateDynamicField(this.noimages, msg, this));
      let ImageSize = App.util.evaluateDynamicField(this.imagesize, msg, this);
      let PersonalToken = App.util.evaluateDynamicField(this.personaltoken, msg, this);
  

      let options = {};
      try {

        if (this.operation === 'conversation') {
          let ConversationEvent = {};
          ConversationEvent = {
            "model": this.model,
            "prompt": Instruction,
            "max_tokens": Maxtoken || 16
          }
          console.log(ConversationEvent);
          options = {
            headers: {
              "Content-Type": 'application/json',
              "Authorization": `Bearer ${PersonalToken}`
            },
            url: `https://api.openai.com/v1/completions`,
            method: 'POST',
            responseType: 'json',
            body: JSON.stringify(ConversationEvent)
          };
        }else{
          let ImageEvent = {};
          ImageEvent = {
            "prompt": Instruction,
            "n": NoImages,
            "size" : ImageSize || "1024x1024"
          }
          console.log(ImageEvent);
          options = {
            headers: {
              "Content-Type": 'application/json',
              "Authorization": `Bearer ${PersonalToken}`
            },
            url: `https://api.openai.com/v1/images/generations`,
            method: 'POST',
            responseType: 'json',
            body: JSON.stringify(ImageEvent)
        }
      }

        let response = await this.http(options);
        if (response.statusCode === 201 || response.statusCode === 200 || response.statusCode === 204) {
          msg.header.ChatGPT = {};
          msg.header.ChatGPT.message = response.body;
          msg.header.ChatGPT.statuscode = response.statusCode;
          this.send(msg)
          return
        } else {
          let err = {}
          err.message = response.body;
          err.statuscode = response.statusCode
          this.sendError(new ChatGPTError(JSON.stringify(err)), msg)
          return;
        }
      } catch (error) {
        this.sendError(new ChatGPTError(error), msg)
        return;
      }
    }
  }
  App.nodes.registerType('ChatGPT', ChatGPT);
};
