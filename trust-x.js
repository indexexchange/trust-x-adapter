/**
 * File Information
 * =============================================================================
 * @overview  Partner Module Template
 * @version   1.5.x
 * @author    Index Exchange
 * @copyright Copyright (C) 2016 Index Exchange All Rights Reserved.
 *
 * The information contained within this document is confidential, copyrighted
 * and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 * -----------------------------------------------------------------------------
 */

window.headertag.partnerScopes.push(function() {
    'use strict';

    /* =============================================================================
     * SECTION A | Configure Module Name and Feature Support
     * -----------------------------------------------------------------------------
     *
     * Configure all of the following settings for this module.
     *
     * PARTNER_ID:
     *     Three or four character partner ID provided by Index Exchange.
     *
     * SUPPORTED_TARGETING_TYPES:
     *     The types of targeting that are supported by this module.
     *
     *          - page: targeting is set on the page as a whole.
     *          - slot: targeting is set on each slot individually.
     *
     * SUPPORTED_ANALYTICS:
     *     The types of analytics the wrapper should support for this module.
     *
     *          - time:   time between when this module's getDemand function is
     *                    called, and when it returns its retrieved demand.
     *          - demand: the targeting information returned from this module.
     *
     */

    var PARTNER_ID = 'TRSTX';

    var SUPPORTED_TARGETING_TYPES = {
        page: false,
        slot: true
    };

    var SUPPORTED_ANALYTICS = {
        time: true,
        demand: true
    };

    var SUPPORTED_OPTIONS = {};

    /* -------------------------------------------------------------------------- */

    var Utils = window.headertag.Utils;
    var Network = window.headertag.Network;
    var BidRoundingTransformer = window.headertag.BidRoundingTransformer;
    var GlobalConfig = window.headertagconfig || {};

    function validateTargetingType(tt) {
        return typeof tt === 'string' && SUPPORTED_TARGETING_TYPES[tt];
    }

    function init(config, callback) {
        //? if (DEBUG) {
        var err = [];

        if (!config.hasOwnProperty('targetingType') || !validateTargetingType(config.targetingType)) {
            err.push('targetingType either not provided or invalid.');
        }

        /* =============================================================================
         * SECTION B | Validate Module-Specific Configurations
         * -----------------------------------------------------------------------------
         *
         * Validate all the module-specific parameters in the `config` object.
         * Validation functions have been provided in the `Utils` object for
         * convenience. See ../lib/utils.js for more information.
         *
         * For required configurations use:
         *
         *     if (!config.hasOwnProperty(<parameter>) || ... || ...) {
         *         err.push(<error message>);
         *     }
         *
         * For optional configurations use:
         *
         *     if (config.hasOwnProperty(<parameters>)  && (... || ...)) {
         *         err.push(<error message>);
         *     }
         *
         */

        /* PUT CODE HERE */

        if (config.hasOwnProperty('timeout') && (
            !Utils.isNumber(config.timeout) ||
            config.timeout < 0
            )) {
            err.push('timeout must be a real number');
        }

        /* -------------------------------------------------------------------------- */

        var xSlotConfigValid = true;

        if (!config.hasOwnProperty('xSlots') || typeof config.xSlots !== 'object' || Utils.isArray(config.xSlots)) {
            err.push('xSlots either not provided or invalid.');
            xSlotConfigValid = false;
        } else {
            for(var xSlotName in config.xSlots){
                if(!config.xSlots.hasOwnProperty(xSlotName)){
                    continue;
                }

        /* =============================================================================
         * SECTION C | Validate Partner Slot Configurations
         * -----------------------------------------------------------------------------
         *
         * Validate the specific configurations that must appear in each xSlot.
         * An xSlot represents an ad slot as it is understood by the partner's end point.
         * Validation functions have been provided in the `Utils` object for
         * convenience. See ../lib/utils.js for more information.
         *
         * For required configurations use:
         *
         *     if (!config.hasOwnProperty(<parameter>) || ... || ...) {
         *         err.push(<error message>);
         *     }
         *
         * For optional configurations use:
         *
         *     if (config.hasOwnProperty(<parameters>)  && (... || ...)) {
         *         err.push(<error message>);
         *     }
         *
         */

        /* PUT CODE HERE */
                if (!Utils.isObject(config.xSlots[xSlotName])) {
                    err.push('xSlot must be an object');
                }

                if (!config.xSlots[xSlotName].hasOwnProperty('placement') ||
                    !config.xSlots[xSlotName].placement ||
                    isNaN(1 * config.xSlots[xSlotName].placement.toString())
                ) {
                    err.push('placement must be defined and must be a number or a number like string');
                }
        /* -------------------------------------------------------------------------- */

            }
        }

        if (!config.hasOwnProperty('mapping') || typeof config.xSlots !== 'object' || Utils.isArray(config.xSlots)) {
            err.push('mapping either not provided or invalid.');
        } else {
            var seenXSlots = {};

            for(var htSlotName in config.mapping){
                if(!config.mapping.hasOwnProperty(htSlotName)){
                    continue;
                }

                var htSlotMapping = config.mapping[htSlotName];

                if(!Utils.isArray(htSlotMapping) || !htSlotMapping.length){
                    err.push('slot mappings missing or invalid for htSlot ' + htSlotName);
                } else {
                    for(var k = 0; k < htSlotMapping.length; k++){
                        if(!Utils.validateNonEmptyString(htSlotMapping[k])){
                            err.push('slot mappings missing or invalid for htSlot ' + htSlotName);
                        } else if(xSlotConfigValid){
                            if(config.xSlots.hasOwnProperty(htSlotMapping[k])){
                                if(seenXSlots.hasOwnProperty(htSlotMapping[k])){
                                    err.push('xSlot ' + htSlotMapping[k] + ' mapped multiple times in ' + PARTNER_ID +' config');
                                } else {
                                    seenXSlots[htSlotMapping[k]] = true;
                                }
                            } else {
                                err.push('invalid xSlot ' + htSlotMapping[k] + ' in mapping for htSlot ' + htSlotName);
                            }
                        }
                    }
                }
            }
        }

        if (config.hasOwnProperty('targetKeyOverride')) {
            if (!Utils.validateNonEmptyObject(config.targetKeyOverride)) {
                err.push('targetKeyOverride must be a non-empty object');
            } else {
                if (config.targetKeyOverride.omKey && !Utils.validateNonEmptyString(config.targetKeyOverride.omKey)) {
                    err.push('targetKeyOverride.omKey must be a non-empty string');
                }

                if (config.targetKeyOverride.pmKey && !Utils.validateNonEmptyString(config.targetKeyOverride.pmKey)) {
                    err.push('targetKeyOverride.pmKey must be a non-empty string');
                }

                if (config.targetKeyOverride.idKey && !Utils.validateNonEmptyString(config.targetKeyOverride.idKey)) {
                    err.push('targetKeyOverride.idKey must be a non-empty string');
                }
            }
        }

        if(config.hasOwnProperty('roundingBuckets')){
            if (!Utils.validateNonEmptyObject(config.roundingBuckets)) {
                err.push('roundingBuckets must be a non-empty object');
            } else {
                var rConf = config.roundingBuckets;
                if(rConf.floor && (typeof rConf.floor !== 'number' || rConf.floor < 0)){
                    err.push('roundingBuckets.floor must be a non-negative number');
                }
                if(rConf.inputCentsMultiplier && (typeof rConf.inputCentsMultiplier !== 'number' || rConf.inputCentsMultiplier < 0)){
                    err.push('roundingBuckets.floor must be a non-negative number');
                }
                if(rConf.outputCentsDivisor && (typeof rConf.outputCentsDivisor !== 'number' || rConf.outputCentsDivisor < 0)){
                    err.push('roundingBuckets.floor must be a non-negative number');
                }
                if(rConf.outputPrecision && !Utils.validateInteger(rConf.outputPrecision)){
                    err.push('roundingBuckets.outputPrecision must be an integer');
                }
                if(rConf.roundingType && !Utils.validateInteger(rConf.roundingType, 0, 3)){
                    err.push('roundingBuckets.roundingType must be a valid rounding type');
                }
                if(rConf.buckets && (!Utils.isArray(rConf.buckets) || rConf.buckets.length === 0)){
                    err.push('roundingBuckets.buckets must be an array');
                } else {
                    for(var l = 0; l < rConf.buckets.length; l++){
                        if(!Utils.validateNonEmptyObject(rConf.buckets[l])){
                            err.push('roundingBuckets.buckets must contain non-empty objects');
                            break;
                        }
                    }
                }
            }
        }

        if (err.length) {
            callback(err);
            return;
        }

        //? }

        var yourBidder = new TrustX(config);

        window.headertag.TrustXHtb = {};
        window.headertag.TrustXHtb.render = yourBidder.renderAd;

        window.headertag[PARTNER_ID] = {};
        window.headertag[PARTNER_ID].callback = yourBidder.responseCallback;

        callback(null, yourBidder);
    }

    function TrustX(config) {
        var _this = this;

        var __targetingType = config.targetingType;
        var __supportedAnalytics = SUPPORTED_ANALYTICS;
        var __supportedOptions = SUPPORTED_OPTIONS;

        var __creativeStore = {};

        /* =============================================================================
         * Set default targeting keys to be used for DFP. Values for omKey and idKey are
         * mandatory. pmKey/pmidKey(deals) is only necessary if the partner will use a private market.
         *
         * Standard values are:
         *
         * omKey: ix_(PARTNER ID)_cpm
         * pmKey: ix_(PARTNER ID)_cpm
         * idKey: ix_(PARTNER ID)_id
         * pmidKey: ix_(PARTNER ID)_dealid
         */
        var __targetingKeys = {
            omKey: 'ix_trstx_cpm',
            pmKey: 'ix_trstx_cpm',
            idKey: 'ix_trstx_id',
            pmidKey: 'ix_trstx_dealid'
        };

        if (config.targetKeyOverride) {
            if (config.targetKeyOverride.omKey) {
                __targetingKeys.omKey = config.targetKeyOverride.omKey;
            }

            if (config.targetKeyOverride.pmKey) {
                __targetingKeys.pmKey = config.targetKeyOverride.pmKey;
            }

            if (config.targetKeyOverride.idKey) {
                __targetingKeys.idKey = config.targetKeyOverride.idKey;
            }

            if (config.targetKeyOverride.pmidKey) {
                __targetingKeys.pmidKey = config.targetKeyOverride.pmidKey;
            }
        }

        var __bidTransformer;

        /* =============================================================================
         * Set the default parameters for interpreting the prices sent by the bidder
         * endpoint. The bid transformer library uses cents internally, so this object
         * specifies how to transform to and from the units provided by the bidder
         * endpoint and expected by the DFP line item targeting. See
         * bid-rounding-transformer.js for more information.
         */
        var __bidTransformConfig = {        // Default rounding configuration
            "floor": 0,                     // Minimum acceptable bid price
            "inputCentsMultiplier": 100,    // Multiply input bids by this to get cents
            "outputCentsDivisor": 1,        // Divide output bids in cents by this
            "outputPrecision": 0,           // Decimal places in output
            "roundingType": 1,              // Rounding method (1 is floor)
            "buckets": [{                   // Buckets specifying rounding steps
                "max": 2000,                // Maximum number of cents for this bucket
                "step": 5                   // Increments for this bucket in cents
            }, {
                "max": 5000,                // Maximum number of cents for this bucket
                "step": 100                 // Increments for this bucket in cents
            }]
        };

        if(config.roundingBuckets){
            __bidTransformConfig = config.roundingBuckets;
        }

        /* =============================================================================
         * Use the bidTransformer object to round bids received from the partner
         * endpoint. Usage:
         *
         * var roundedBid = bidTransformer.transformBid(rawBid);
         */

        __bidTransformer = BidRoundingTransformer(__bidTransformConfig);

        /* =============================================================================
         * SECTION E | Copy over the Configurations to Internal Variables
         * -----------------------------------------------------------------------------
         *
         * Assign all the required values from the `config` object to internal
         * variables. These values do not need to be validated here as they have already
         * been validated in `init`.
         *
         * Example:
         *
         *      var <internal parameter> = config.<corresponding parameter>;
         */

        /* PUT CODE HERE */
        var globalTimeout = GlobalConfig.timeout;
        var adapterTimeout = config.timeout;
        var htSlotMapping = config.mapping;
        var xSlotsConfig = config.xSlots;
        var callbackName = 'window.headertag["'+PARTNER_ID+'"].callback';
        var protocol = 'https:' === location.protocol? 'https:' : 'http:';
        var mainUrl = protocol + '//sofia.trustx.org/hb';
        var tmpSavedResults = {};

        if (globalTimeout) {
            adapterTimeout = adapterTimeout? Math.min(adapterTimeout, globalTimeout) : globalTimeout
        }

        /* -------------------------------------------------------------------------- */

        this.getPartnerTargetingType = function getPartnerTargetingType() {
            return __targetingType;
        };

        this.getSupportedAnalytics = function getSupportedAnalytics() {
            return __supportedAnalytics;
        };

        this.getSupportedOptions = function getSupportedOptions() {
            return __supportedOptions;
        };

        function tryToSendStat(startTime, timeout, uids, isTimeouted, error) {
            if (Math.random() < 0.1) {
                var stat = {
                    wrapper: 'index',
                    tt: timeout,
                    ct: Utils.now() - startTime,
                    st: isTimeouted? 'to' : error? 'err' : 'ok',
                    cr: 10
                };
                stat = encodeURIComponent(JSON.stringify(stat));
                uids = encodeURIComponent(uids.join(','));
                (new Image()).src = protocol + '//sofia.trustx.org/hbstat?auids='+uids+'&stat='+stat+'&rnd=' + Math.random();
            }
        }

        function __requestDemandForSlots(htSlotNames, callback){

            /* =============================================================================
             * SECTION F | Request demand from the Module's Ad Server
             * -----------------------------------------------------------------------------
             *
             * The `htSlotNames` argument is an array of HeaderTagSlot IDs for which demand
             * is requested. Look these up in the mapping object of the config to determine
             * the partner xSlots which should have demand requested for them.
             *
             * Make a request to the module's ad server to get demand. If there is an error
             * while doing so, then call `callback` as such:
             *
             *      callback(err);
             *
             * where `err` is a descriptive error message.
             *
             * If there are no errors, and demand is returned from the ad servers, call
             * `callback` as such:
             *
             *      callback(null, demand);
             *
             * where `demand` is an object containing the slot-level demand in the following
             * format:
             *
             *     {
             *         <htSlotId>: {
             *             demand: {
             *                 <key>: <value>,
             *                 <key>: <value>,
             *                 ...
             *             }
             *         },
             *         ...
             *     }
             */

            /* PUT CODE HERE */
            var placements = [];
            for (var placementsMap = {}, xSlots, i=0, l=htSlotNames.length; i<l; i++) {
                xSlots = htSlotMapping[htSlotNames[i]];
                if (xSlots) {
                    for (var xSlot, j=0, n=xSlots.length; j<n; j++) {
                        xSlot = xSlotsConfig[xSlots[j]];
                        if (xSlot && !placementsMap[xSlot.placement]) {
                            placementsMap[xSlot.placement] = xSlots[j];
                            placements.push(xSlot.placement);
                        }
                    }
                }
            }

            var uniq = Math.random().toString(16).substr(2);

            Network.ajax({
                async: true,
                timeout: 10000,
                method: "GET",
                jsonp: true,
                withCredentials: true,
                data: {
                    auids: placements.join(','),
                    u: Utils.getPageUrl(),
                    pt: 'net',
                    cb: callbackName + '("' + uniq + '")',
                    rnd: uniq
                },
                url: mainUrl,
                onTimeout: function(){
                    callback('Trustx request is timeouted', null, placements);
                },
                onSuccess: function (responseText) {
                    var result = null, errorMessage = null;
                    try {
                        responseText && eval(responseText);
                        var savedResponse = tmpSavedResults[uniq];
                        delete tmpSavedResults[uniq];
                        if (savedResponse && Utils.isObject(savedResponse)) {
                            var sizeId, storeObject, bid, i, l, xSlots, bidIds, bidValues, deals, demand, xSlotsData = {};
                            result = {};
                            if (savedResponse.seatbid) {
                                for (i=0, l=savedResponse.seatbid.length; i<l; i++) {
                                    bid = savedResponse.seatbid[i] && savedResponse.seatbid[i].bid;
                                    if (bid && bid[0] && bid[0].auid && bid[0].adm && placementsMap[bid[0].auid]) {
                                        xSlotsData[placementsMap[bid[0].auid]] = bid[0];
                                    }
                                }
                                for (i=0, l=htSlotNames.length; i<l; i++) {
                                    xSlots = htSlotMapping[htSlotNames[i]];
                                    bidIds = [];
                                    bidValues = [];
                                    deals = [];
                                    for (var j=0, n=xSlots.length; j<n; j++) {
                                        if (xSlotsData[xSlots[j]]) {
                                            bid = xSlotsData[xSlots[j]];
                                            storeObject = __creativeStore[bid.auid] || {};
                                            sizeId = bid.w + 'x' + bid.h;
                                            storeObject[sizeId] = { ad: bid.adm };
                                            __creativeStore[bid.auid] = storeObject;

                                            bidIds.push(bid.auid);
                                            bidValues.push(sizeId + '_' + __bidTransformer.transformBid(bid.price));
                                            deals.push(bid.dealid? sizeId + '_' + bid.dealid : '');

                                        }
                                    }
                                    if (bidIds.length) {
                                        demand = {};
                                        demand[__targetingKeys.idKey] = bidIds.length > 1 ? bidIds : bidIds[0];
                                        demand[__targetingKeys.omKey] = bidValues.length > 1 ? bidValues : bidValues[0];
                                        if (deals[0]) {
                                            demand[__targetingKeys.pmidKey] = deals.length > 1? deals : deals[0];
                                        }
                                        result[htSlotNames[i]] = { demand: demand };
                                    }
                                }
                            }
                        } else {
                            errorMessage ='Unable to get demand from trustx, wrong response was received';
                        }
                    } catch(err) {
                        errorMessage = 'Unable to get demand from trustx, error ' + (err.message || err.toString()) + ' received';
                    }
                    callback(errorMessage, result, placements);
                },
                onFailure: function (status) {
                    callback('Unable to get demand from trustx, ' + status + ' received', null, placements);
                }
            });
            /* -------------------------------------------------------------------------- */

        }

        this.getDemand = function getDemand(correlator, slots, callback) {
            var startTime = Utils.now();
            var requestIsTimeouted = false;
            if (adapterTimeout) {
                var getDemandTimeout = setTimeout(function(){
                    requestIsTimeouted = true;
                    //? if (DEBUG)
                    console.log(PARTNER_ID + ' is timeouted');
                }, adapterTimeout);
            }
            var htSlotNames = Utils.getDivIds(slots);
            var demand = { slot: {} };
            function callCallback(err, result, requestedUids) {
                if (getDemandTimeout) {
                    clearTimeout(getDemandTimeout);
                }
                tryToSendStat(startTime, adapterTimeout, requestedUids, requestIsTimeouted, err);
                err? callback(err) : callback(null, result);
            }

            __requestDemandForSlots(htSlotNames, function(err, demandForSlots, requestedUids){
                if (err) {
                    if (Utils.isString(err)) {
                        //? if (DEBUG)
                        console.log(err);
                    }
                    callCallback(err, null, requestedUids);
                    return;
                }

                if(!demandForSlots){
                    callCallback('Error: demandForSlots not set', null, requestedUids);
                    return;
                }

                for (var htSlotName in demandForSlots) {
                    if (!demandForSlots.hasOwnProperty(htSlotName)) {
                        continue;
                    }
                    demand.slot[htSlotName] = demandForSlots[htSlotName];
                    demand.slot[htSlotName].timestamp = Utils.now();
                }
                callCallback(null, demand, requestedUids);
            });
        };

        this.responseCallback = function(uniq){
            return function(responseObj) {
                /* =============================================================================
                 * SECTION G | Parse Demand from the Module's Ad Server
                 * -----------------------------------------------------------------------------
                 *
                 * Run this function as a callback when the ad server responds with demand.
                 * Store creatives and demand in global objects as needed for processing.
                 */

                /* PUT CODE HERE */
                tmpSavedResults[uniq] = responseObj;
                /* -------------------------------------------------------------------------- */
            }
        };

        this.renderAd = function(doc, targetingMap, width, height) {
            /* =============================================================================
             * SECTION H | Render function
             * -----------------------------------------------------------------------------
             *
             * This function will be called by the DFP creative to render the ad. It should
             * work as-is, but additions may be necessary here if there beacons, tracking
             * pixels etc. that need to be called as well.
             */

            if (doc && targetingMap && width && height) {
                try {
                    var id = targetingMap[__targetingKeys.idKey][0];
                    
                    var sizeKey = width + 'x' + height;
                    if (window.headertag.sizeRetargeting && window.headertag.sizeRetargeting[sizeKey]){
                        width = window.headertag.sizeRetargeting[sizeKey][0];
                        height = window.headertag.sizeRetargeting[sizeKey][1];
                    }

                    var ad = __creativeStore[id][width + 'x' + height].ad;

                    doc.write(ad);
                    doc.close();
                    if (doc.defaultView && doc.defaultView.frameElement) {
                        doc.defaultView.frameElement.width = width;
                        doc.defaultView.frameElement.height = height;
                    }
                } catch (e){
                    //? if (DEBUG)
                    console.log('Error trying to write ' + PARTNER_ID + ' ad to the page');
                }

            }
        };
    }

    window.headertag.registerPartner(PARTNER_ID, init);
});
