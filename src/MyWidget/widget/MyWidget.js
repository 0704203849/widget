/*global logger*/
/*
    MyWidget
    ========================

    @file      : MyWidget.js
    @version   : 1.0.0
    @author    : Conrad G
    @date      : 7/10/2017
    @copyright : flock of birds 2017
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    //to be able to create a dijit widget,these 3 files are needed
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    //thses files(extra dojo and mendix functionality) are needed to be able to create and alter html and javascript events
    "mxui/dom",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",
    //these two files are external libraries. dojo/text can help you load in any html and css templates used in the custom widget
    "MyWidget/lib/jquery-1.11.2",
    "dojo/text!MyWidget/widget/template/MyWidget.html"
], function (declare, _WidgetBase, _TemplatedMixin, dom, dojoDom, dojoStyle,
    dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent, _jQuery, widgetTemplate) {

        "use strict";

        // Declare widget's prototype.
        return declare("MyWidget.widget.MyWidget", [_WidgetBase, _TemplatedMixin], {

            // _TemplatedMixin will create our dom node using this HTML template.
            templateString: widgetTemplate,

            // DOM elements
            reverse: null,

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
               // this._setupEvents();
            },

            // mxui.widget._WidgetBase.update is called when context is changed or initialized. Implement to re-render and / or fetch data.
            update: function (objct, callback) {
                logger.debug(this.id + ".update");
                this._contextObject = objct;
                this._resetSubscriptions();
                this._updateRendering(callback); // We're passing the callback to updateRendering to be called after DOM-manipulation
            },

            // mxui.widget._WidgetBase.enable is called when the widget should enable editing. Implement to enable editing if widget is input widget.
            enable: function () {
                logger.debug(this.id + ".enable");
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

            // We want to stop events on a mobile device
            _stopBubblingEventOnMobile: function (e) {
                logger.debug(this.id + "._stopBubblingEventOnMobile");
                if (typeof document.ontouchstart !== "undefined") {
                    dojoEvent.stop(e);
                }
            },

            reverseText: function (string) {
                var newString = "";
                for (var i = string.length - 1; i >= 0; i--) {
                    newString += string[i];
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
