/**
 * @author:    Partner
 * @license:   UNLICENSED
 *
 * @copyright: Copyright (c) 2017 by Index Exchange. All rights reserved.
 *
 * The information contained within this document is confidential, copyrighted
 * and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 */

'use strict';

////////////////////////////////////////////////////////////////////////////////
// Dependencies ////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var BidTransformer = require('bid-transformer.js');
var Browser = require('browser.js');
var Classify = require('classify.js');
var Constants = require('constants.js');
var Partner = require('partner.js');
var Size = require('size.js');
var SpaceCamp = require('space-camp.js');
var System = require('system.js');
var EventsService;
var RenderService;

//? if (DEBUG) {
var ConfigValidators = require('config-validators.js');
var PartnerSpecificValidator = require('trust-x-htb-validator.js');
var Whoopsie = require('whoopsie.js');
//? }

////////////////////////////////////////////////////////////////////////////////
// Main ////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Partner module template
 *
 * @class
 */
function TrustXHtb(configs) {
    /* =====================================
     * Data
     * ---------------------------------- */

    /* Private
     * ---------------------------------- */

    /**
     * Reference to the partner base class.
     *
     * @private {object}
     */
    var __baseClass;

    /**
     * Profile for this partner.
     *
     * @private {object}
     */
    var __profile;

    /**
     * Base url for bid requests.
     *
     * @private {object}
     */
    var __baseUrl;

    /**
     * Url of user sync pixel.
     * @private {string}
     */
    var __syncUrl;

    /**
     * Instances of BidTransformer for transforming bids.
     *
     * @private {object}
     */
    var __bidTransformers;

    /* =====================================
     * Functions
     * ---------------------------------- */

    /* Utilities
     * ---------------------------------- */

     /**
     * Returns the matching bid given a single parcel and an array of bids
     * returned from the ad server.
     *
     * @param {object} parcel the parcel for which a bid needs to be found
     * @param {any} bidResponse the bidResponse object containing all the bids returned
     *                          from the server
     * @returns {any} the bid that belongs to the parcel if found
     */
    function __getMatchingBid(parcel, bidResponse) {

        if (!bidResponse.hasOwnProperty('seatbid')){
            return null;
        }

        for (var h = 0; h < bidResponse.seatbid.length; h++) {
            var bids = bidResponse.seatbid[h].bid;

            for (var i = 0; i < bids.length; i++) {
                if (parcel.xSlotRef.adSlotId === String(bids[i].auid)) {
                    return bids[i];
                }
            }
        }

        return null;
    }

    /**
     * Generates the request URL and query data to the endpoint for the xSlots
     * in the given returnParcels.
     *
     * @param  {object[]} returnParcels
     *
     * @return {object}
     */
    function __generateRequestObj(returnParcels) {
        var queryObj = {};
        var callbackId = '_' + System.generateUniqueId();

        /* =============================================================================
         * STEP 2  | Generate Request URL
         * -----------------------------------------------------------------------------
         *
         * Generate the URL to request demand from the partner endpoint using the provided
         * returnParcels. The returnParcels is an array of objects each object containing
         * an .xSlotRef which is a reference to the xSlot object from the partner configuration.
         * Use this to retrieve the placements/xSlots you need to request for.
         *
         * If your partner is MRA, returnParcels will be an array of length one. If your
         * partner is SRA, it will contain any number of entities. In any event, the full
         * contents of the array should be able to fit into a single request and the
         * return value of this function should similarly represent a single request to the
         * endpoint.
         *
         * Return an object containing:
         * queryUrl: the url for the request
         * data: the query object containing a map of the query string paramaters
         *
         * callbackId:
         *
         * arbitrary id to match the request with the response in the callback function. If
         * your endpoint supports passing in an arbitrary ID and returning as part of the response
         * please use the callbackType: Partner.CallbackTypes.ID and fill out the adResponseCallback.
         * Also please provide this adResponseCallback to your bid request here so that the JSONP
         * response calls it once it has completed.
         *
         * If your endpoint does not support passing in an ID, simply use
         * Partner.CallbackTypes.CALLBACK_NAME and the wrapper will take care of handling request
         * matching by generating unique callbacks for each request using the callbackId.
         *
         * If your endpoint is ajax only, please set the appropriate values in your profile for this,
         * i.e. Partner.CallbackTypes.NONE and Partner.Requesttypes.AJAX
         *
         * The return object should look something like this:
         * {
         *     url: 'http://bidserver.com/api/bids' // base request url for a GET/POST request
         *     data: { // query string object that will be attached to the base url
         *        slots: [
         *             {
         *                 placementId: 54321,
         *                 sizes: [[300, 250]]
         *             },{
         *                 placementId: 12345,
         *                 sizes: [[300, 600]]
         *             },{
         *                 placementId: 654321,
         *                 sizes: [[728, 90]]
         *             }
         *         ],
         *         site: 'http://google.com'
         *     },
         *     callbackId: '_23sd2ij4i1' //unique id used for pairing requests and responses
         * }
         */

        /* PUT CODE HERE */
        var adSlotIds = [];

        for (var i = 0; i < returnParcels.length; i++) {
            adSlotIds.push(returnParcels[i].xSlotRef.adSlotId);
        }

        queryObj.auids = adSlotIds.join(',');
        queryObj.u = Browser.getPageUrl();
        queryObj.pt = 'net';
        queryObj.cb = 'window.' + SpaceCamp.NAMESPACE + '.' + __profile.namespace + '.adResponseCallbacks.' + callbackId;
        /* -------------------------------------------------------------------------- */

        return {
            url: __baseUrl,
            data: queryObj,
            callbackId: callbackId
        };
    }

    /* -------------------------------------------------------------------------- */

    /* Helpers
     * ---------------------------------- */

    /* =============================================================================
     * STEP 5  | Rendering
     * -----------------------------------------------------------------------------
     *
     * This function will render the ad given. Usually need not be changed unless
     * special render functionality is needed.
     *
     * @param  {Object} doc The document of the iframe where the ad will go.
     * @param  {string} adm The ad code that came with the original demand.
     */
    function __render(doc, adm) {
        System.documentWrite(doc, adm);
    }

    /**
     * Parses and extracts demand from adResponse according to the adapter and then attaches it
     * to the corresponding bid's returnParcel in the correct format using targeting keys.
     *
     * @param {string} sessionId The sessionId, used for stats and other events.
     *
     * @param {any} adResponse This is the adresponse as returned from the bid request, that was either
     * passed to a JSONP callback or simply sent back via AJAX.
     *
     * @param {object[]} returnParcels The array of original parcels, SAME array that was passed to
     * generateRequestObj to signal which slots need demand. In this funciton, the demand needs to be
     * attached to each one of the objects for which the demand was originally requested for.
     */
    function __parseResponse(sessionId, adResponse, returnParcels) {

        /* =============================================================================
         * STEP 4  | Parse & store demand response
         * -----------------------------------------------------------------------------
         *
         * Fill the below variables with information about the bid from the partner, using
         * the adResponse variable that contains your module adResponse.
         */

        /* This an array of all the bids in your response that will be iterated over below. Each of
         * these will be mapped back to a returnParcel object using some criteria explained below.
         * The following variables will also be parsed and attached to that returnParcel object as
         * returned demand.
         *
         * Use the adResponse variable to extract your bid information and insert it into the
         * bids array. Each element in the bids array should represent a single bid and should
         * match up to a single element from the returnParcel array.
         *
         */

        /* ---------- Process adResponse and extract the bids into the bids array ------------*/

        for (var j = 0; j < returnParcels.length; j++) {
            var curReturnParcel = returnParcels[j];

            /* Find a matching bid for the parcel */
            var curBid = __getMatchingBid(curReturnParcel, adResponse);

            var headerStatsInfo = {};
            headerStatsInfo[curReturnParcel.htSlot.getId()] = [curReturnParcel.xSlotName];

            /* No matching bid found so its a pass */
            if (!curBid) {
                if (__profile.enabledAnalytics.requestTime) {
                    __baseClass._emitStatsEvent(sessionId, 'hs_slot_pass', headerStatsInfo);
                }
                curReturnParcel.pass = true;
                continue;
            }

            /* ---------- Fill the bid variables with data from the bid response here. ------------*/

            var bidPrice = curBid.price; // the bid price for the given slot
            var bidSize = [curBid.w, curBid.h]; // the size of the given slot
            var bidCreative = curBid.adm; // the creative/adm for the given slot that will be rendered if is the winner.
            var bidDealId = curBid.dealid; // the dealId if applicable for this slot.

            /* ---------------------------------------------------------------------------------------*/

            if (__profile.enabledAnalytics.requestTime) {
                __baseClass._emitStatsEvent(sessionId, 'hs_slot_bid', headerStatsInfo);
            }

            curReturnParcel.size = bidSize;
            curReturnParcel.targetingType = 'slot';
            curReturnParcel.targeting = {};

            //? if (FEATURES.GPT_LINE_ITEMS) {
            var targetingCpm = __bidTransformers.targeting.apply(bidPrice);
            var sizeKey = Size.arrayToString(curReturnParcel.size);

            if (bidDealId) {
                curReturnParcel.targeting[__baseClass._configs.targetingKeys.pmid] = [sizeKey + '_' + bidDealId];
                curReturnParcel.targeting[__baseClass._configs.targetingKeys.pm] = [sizeKey + '_' + targetingCpm];
            } else {
                curReturnParcel.targeting[__baseClass._configs.targetingKeys.om] = [sizeKey + '_' + targetingCpm];
            }
            curReturnParcel.targeting[__baseClass._configs.targetingKeys.id] = [curReturnParcel.requestId];

            if (__baseClass._configs.lineItemType === Constants.LineItemTypes.ID_AND_SIZE) {
                RenderService.registerAdByIdAndSize(
                    sessionId,
                    __profile.partnerId,
                    __render, [bidCreative],
                    '',
                    __profile.features.demandExpiry.enabled ? (__profile.features.demandExpiry.value + System.now()) : 0,
                    curReturnParcel.requestId, bidSize
                );
            } else if (__baseClass._configs.lineItemType === Constants.LineItemTypes.ID_AND_PRICE) {
                RenderService.registerAdByIdAndPrice(
                    sessionId,
                    __profile.partnerId,
                    __render, [bidCreative],
                    '',
                    __profile.features.demandExpiry.enabled ? (__profile.features.demandExpiry.value + System.now()) : 0,
                    curReturnParcel.requestId,
                    targetingCpm
                );
            }
            //? }

            //? if (FEATURES.RETURN_CREATIVE) {
            curReturnParcel.adm = bidCreative;
            //? }

            //? if (FEATURES.RETURN_PRICE) {
            curReturnParcel.price = Number(__bidTransformers.price.apply(bidPrice));
            //? }

            //? if (FEATURES.INTERNAL_RENDER) {
            var pubKitAdId = RenderService.registerAd(
                sessionId,
                __profile.partnerId,
                __render, [bidCreative],
                '',
                __profile.features.demandExpiry.enabled ? (__profile.features.demandExpiry.value + System.now()) : 0
            );
            curReturnParcel.targeting.pubKitAdId = pubKitAdId;
            //? }
        }
        (new Image).src = __syncUrl;
    }

    /* =====================================
     * Constructors
     * ---------------------------------- */

    (function __constructor() {
        EventsService = SpaceCamp.services.EventsService;
        RenderService = SpaceCamp.services.RenderService;

        /* =============================================================================
         * STEP 1  | Partner Configuration
         * -----------------------------------------------------------------------------
         *
         * Please fill out the below partner profile according to the steps in the README doc.
         */

        /* ---------- Please fill out this partner profile according to your module ------------*/
        __profile = {
            partnerId: 'TrustXHtb', // PartnerName
            namespace: 'TrustXHtb', // Should be same as partnerName
            statsId: 'TRSTX',
            version: '2.0.0',
            targetingType: 'slot',
            enabledAnalytics: {
                requestTime: true
            },
            features: {
                demandExpiry: {
                    enabled: false,
                    value: 0
                },
                rateLimiting: {
                    enabled: false,
                    value: 0
                }
            },
            targetingKeys: { // Targeting keys for demand, should follow format ix_{statsId}_id
                id: 'ix_trstx_id',
                om: 'ix_trstx_cpm',
                pm: 'ix_trstx_cpm',
                pmid: 'ix_trstx_dealid'
            },
            lineItemType: Constants.LineItemTypes.ID_AND_SIZE,
            callbackType: Partner.CallbackTypes.CALLBACK_NAME, // Callback type, please refer to the readme for details
            architecture: Partner.Architectures.SRA, // Request architecture, please refer to the readme for details
            requestType: Partner.RequestTypes.ANY // Request type, jsonp, ajax, or any.
        };
        /* ---------------------------------------------------------------------------------------*/

        //? if (DEBUG) {
        var results = ConfigValidators.partnerBaseConfig(configs) || PartnerSpecificValidator(configs);

        if (results) {
            throw Whoopsie('INVALID_CONFIG', results);
        }
        //? }

        /*
         * Adjust the below bidTransformerConfigs variable to match the units the adapter
         * sends bids in and to match line item setup. This configuration variable will
         * be used to transform the bids going into DFP.
         */

        /* - Please fill out this bid trasnformer according to your module's bid response format - */
        var bidTransformerConfigs = {
            //? if (FEATURES.GPT_LINE_ITEMS) {
            targeting: {
                inputCentsMultiplier: 1, // Input is in cents
                outputCentsDivisor: 1, // Output as cents
                outputPrecision: 0, // With 0 decimal places
                roundingType: 'FLOOR', // jshint ignore:line
                floor: 0,
                buckets: [{
                    max: 2000, // Up to 20 dollar (above 5 cents)
                    step: 5 // use 5 cent increments
                }, {
                    max: 5000, // Up to 50 dollars (above 20 dollars)
                    step: 100 // use 1 dollar increments
                }]
            },
            //? }
            //? if (FEATURES.RETURN_PRICE) {
            price: {
                inputCentsMultiplier: 1, // Input is in cents
                outputCentsDivisor: 1, // Output as cents
                outputPrecision: 0, // With 0 decimal places
                roundingType: 'NONE',
            },
            //? }
        };

        /* --------------------------------------------------------------------------------------- */

        if (configs.bidTransformer) {
            //? if (FEATURES.GPT_LINE_ITEMS) {
            bidTransformerConfigs.targeting = configs.bidTransformer;
            //? }
            //? if (FEATURES.RETURN_PRICE) {
            bidTransformerConfigs.price.inputCentsMultiplier = configs.bidTransformer.inputCentsMultiplier;
            //? }
        }

        __bidTransformers = {};

        __baseUrl = Browser.getProtocol() + '//sofia.trustx.org/hb';

        __syncUrl = Browser.getProtocol() + '//sofia.trustx.org/push_sync';

        //? if (FEATURES.GPT_LINE_ITEMS) {
        __bidTransformers.targeting = BidTransformer(bidTransformerConfigs.targeting);
        //? }
        //? if (FEATURES.RETURN_PRICE) {
        __bidTransformers.price = BidTransformer(bidTransformerConfigs.price);
        //? }

        __baseClass = Partner(__profile, configs, null, {
            parseResponse: __parseResponse,
            generateRequestObj: __generateRequestObj
        });
    })();

    /* =====================================
     * Public Interface
     * ---------------------------------- */

    var derivedClass = {
        /* Class Information
         * ---------------------------------- */

        //? if (DEBUG) {
        __type__: 'TrustXHtb',
        //? }

        //? if (TEST) {
        __baseClass: __baseClass,
        //? }

        /* Data
         * ---------------------------------- */

        //? if (TEST) {
        profile: __profile,
        //? }

        /* Functions
         * ---------------------------------- */

        //? if (TEST) {
        render: __render,
        parseResponse: __parseResponse,
        generateRequestObj: __generateRequestObj,
        getMatchingBid: __getMatchingBid
        //? }
    };

    return Classify.derive(__baseClass, derivedClass);
}

////////////////////////////////////////////////////////////////////////////////
// Exports /////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

module.exports = TrustXHtb;
