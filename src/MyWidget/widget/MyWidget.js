/*global logger*/
/*
    MyWidget
    ========================

    @file      : MyWidget.js
    @version   : 0.1.0
    @author    : CJ
    @date      : 7/10/2017
    @copyright : flock of birds 2017
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    "MyWidget/lib/jquery-1.11.2",
    "dojo/text!MyWidget/widget/template/MyWidget.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoStyle,
    dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {

        "use strict";

        // Declare widget's prototype.
        return declare("MyWidget.widget.MyWidget", [_WidgetBase, _TemplatedMixin], {

            // _TemplatedMixin will create our dom node using this HTML template.
            templateString: widgetTemplate,

            // DOM elements from the html file
            reverse: null,
            saveObj: null,

            //parameters configured in the modeler from the xml file.
            textString: "",
            UserInputEntity: "",
            MicroflowToExecute: "",

            // Internal variables. Non-primitives created in the prototype are shared between all widget instances.
            _handles: null,
            _contextObject: null,
            _alertDiv: null,
            _readOnly: false,

            // dojo.declare.constructor is called to construct the widget instance. Implement to initialize non-primitive properties.
            constructor: function () {
                logger.debug(this.id + ".constructor");
                this._handles = [];
            },

            // dijit._WidgetBase.postCreate is called after constructing the widget. Implement to do extra setup work.
            postCreate: function () {
                logger.debug(this.id + ".postCreate");
                if (this.readOnly || this.get("disabled") || this.readonly) {
                    this._readOnly = true;
                }
                this._updateRendering();
            },

            // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
            update: function (objct, callback) {
                logger.debug(this.id + ".update");
                this._contextObject = objct;
                this._resetSubscriptions();
                this._updateRendering(callback);
            },

            // mxui.widget._WidgetBase.resize is called when the page's layout is recalculated. Implement to do sizing calculations. Prefer using CSS instead.
            resize: function (box) {
                logger.debug(this.id + ".resize");
            },

            // mxui.widget._WidgetBase.uninitialize is called when the widget is destroyed. Implement to do special tear-down work.
            uninitialize: function () {
                logger.debug(this.id + ".uninitialize");
                // Clean up listeners, helper objects, etc. There is no need to remove listeners added with this.connect / this.subscribe / this.own.
            },

            reverseText: function (strng) {
                var newString = "";
                for (var i = strng.length - 1; i >= 0; i--) {
                    newString += strng[i];
                }
                return newString;
            },

            // Rerender the interface.
            _updateRendering: function (callback) {
                logger.debug(this.id + "._updateRendering");
                if (this._contextObject !== null) {
                    dojoStyle.set(this.domNode, "display", "block");
                    var dataValue = this._contextObject.get(this.textString);
                    dojoHtml.set(this.reverse, this.reverseText(dataValue));
                } else {
                    dojoStyle.set(this.domNode, "display", "none");
                }
                // Important to clear all validations!
                this._clearValidations();
                // The callback, coming from update, needs to be executed, to let the page know it finished rendering
                this._executeCallback(callback, "_updateRendering");
            },

            SaveString: function (object) {
                mx.data.commit({
                    mxobj: object,
                    callback: function () {
                        console.log("Object committed");
                    },
                    error: function (e) {
                        console.log("Error occurred attempting to commit: " + e);
                    }

                });
            },

            CreateObj: function () {
                mx.data.create({
                    entity: this.UserInputEntity,
                    callback: lang.hitch(this, function (obj) {
                        obj.set(this.textString, this.saveObj.value);
                        this.SaveString(obj);
                        console.log("Object created on server");
                    }),
                    error: function (e) {
                        console.log("an error occured: " + e);
                    }
                });
            },

            useMicroflow: function(){
                 if (this.MicroflowToExecute !== "") {
                    this._executeMf(this.MicroflowToExecute, this._contextObject.getGuid());
                }
            },

            _executeMf: function (microflow, guid, calback) {
                logger.debug(this.id + "._executeMf");
                if (microflow && guid) {

                    mx.ui.action(microflow, {
                        params: {
                            applyto: "selection",
                            guids: [guid]
                        },
                        callback: lang.hitch(this, function (objs) {
                            if (calback && typeof calback === "function") {
                                calback(objs);
                            }
                        }),
                        error: function (error) {
                            mx.ui.error("Error executing microflow " + microflow + " : " + error.message);
                            console.error(this.id + "._executeMf", error);
                        }
                    }, this);
                }
            },

            // Clear validations.
            _clearValidations: function () {
                logger.debug(this.id + "._clearValidations");
                dojoConstruct.destroy(this._alertDiv);
                this._alertDiv = null;
            },

            // Reset subscriptions.
            _resetSubscriptions: function () {
                logger.debug(this.id + "._resetSubscriptions");
                // Release handles on previous object, if any.
                this.unsubscribeAll();
                // When a mendix object exists create subscribtions.
                if (this._contextObject) {
                    this.subscribe({
                        guid: this._contextObject.getGuid(),
                        callback: lang.hitch(this, function (guid) {
                            this._updateRendering();
                        })
                    });
                    this.subscribe({
                        guid: this._contextObject.getGuid(),
                        callback: lang.hitch(this, function (guid, attr, attrValue) {
                            this._updateRendering();
                        })
                    });
                    this.subscribe({
                        guid: this._contextObject.getGuid(),
                        val: true,
                        callback: lang.hitch(this, this._handleValidation)
                    });
                }
            },

            _executeCallback: function (calback, from) {
                logger.debug(this.id + "._executeCallback" + (from ? " from " + from : ""));
                if (calback && typeof calback === "function") {
                    calback();
                }
            }
        });
    });

require(["MyWidget/widget/MyWidget"]);
