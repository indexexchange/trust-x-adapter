/**
 * @author:    Index Exchange
 * @license:   UNLICENSED
 *
 * @copyright: Copyright (C) 2017 by Index Exchange. All rights reserved.
 *
 * The information contained within this document is confidential, copyrighted
 *  and or a trade secret. No part of this document may be reproduced or
 * distributed in any form or by any means, in whole or in part, without the
 * prior written permission of Index Exchange.
 */
// jshint ignore: start

'use strict';

/* =====================================
 * Utilities
 * ---------------------------------- */

/**
 * Returns an array of parcels based on all of the xSlot/htSlot combinations defined
 * in the partnerConfig (simulates a session in which all of them were requested).
 *
 * @param {object} profile
 * @param {object} partnerConfig
 * @returns []
 */
function generateReturnParcels(profile, partnerConfig) {
    var returnParcels = [];

    for (var htSlotName in partnerConfig.mapping) {
        if (partnerConfig.mapping.hasOwnProperty(htSlotName)) {
            var xSlotsArray = partnerConfig.mapping[htSlotName];
            var htSlot = {
                id: htSlotName,
                getId: function () {
                    return this.id;
                }
            }
            for (var i = 0; i < xSlotsArray.length; i++) {
                var xSlotName = xSlotsArray[i];
                returnParcels.push({
                    partnerId: profile.partnerId,
                    htSlot: htSlot,
                    ref: "",
                    xSlotRef: partnerConfig.xSlots[xSlotName],
                    requestId: '_' + Date.now()
                });
            }
        }
    }

    return returnParcels;
}

/* =====================================
 * Testing
 * ---------------------------------- */

describe('generateRequestObj', function () {

    /* Setup and Library Stub
     * ------------------------------------------------------------- */
    var inspector = require('schema-inspector');
    var proxyquire = require('proxyquire').noCallThru();
    var libraryStubData = require('./support/libraryStubData.js');
    var partnerModule = proxyquire('../trust-x-htb.js', libraryStubData);
    var partnerConfig = require('./support/mockPartnerConfig.json');
    var expect = require('chai').expect;
    /* -------------------------------------------------------------------- */

    /* Instantiate your partner module */
    var partnerModule = partnerModule(partnerConfig);
    var partnerProfile = partnerModule.profile;

    /* Generate dummy return parcels based on MRA partner profile */
    var returnParcels;
    var requestObject;

    /* Generate a request object using generated mock return parcels. */
    returnParcels = generateReturnParcels(partnerProfile, partnerConfig);

    /* -------- IF SRA, generate a single request for each parcel -------- */
    if (partnerProfile.architecture) {
        requestObject = partnerModule.generateRequestObj(returnParcels);

        /* Simple type checking, should always pass */
        it('SRA - should return a correctly formatted object', function () {
            var result = inspector.validate({
                type: 'object',
                strict: true,
                properties: {
                    url: {
                        type: 'string',
                        minLength: 1
                    },
                    data: {
                        type: 'object'
                    },
                    callbackId: {
                        type: 'string',
                        minLength: 1
                    }
                }
            }, requestObject);

            expect(result.valid).to.be.true;
        });

        /* Test that the generateRequestObj function creates the correct object by building a URL
            * from the results. This is the bid request url the wrapper will send out to get demand
            * for your module.
            *
            * The url should contain all the necessary parameters for all of the request parcels
            * passed into the function.
            */

        /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
        it('should correctly build a url', function () {
            /* Write unit tests to verify that your bid request url contains the correct
                * request params, url, etc.
                */
            expect(requestObject).to.exist;
        });

        it('should contain a url property', function () {
            expect(requestObject.url).to.exist;
        });

        it('should contain a url property that is a string', function () {
            expect(typeof requestObject.url).to.be.string;
        });

        it('should contain a url that contains the bid request domain', function () {
            var domain = '//sofia.trustx.org/hb';
            expect(requestObject.url.includes(domain)).to.be.true;
        });

        it('should contain a data property', function () {
            expect(requestObject.data).to.exist;
        });

        it('should contain a data property that is an object', function () {
            expect(typeof requestObject.data === 'object').to.be.true;
        });

        it('should contain a data.auids property', function () {
            expect(requestObject.data.auids).to.exist;
        });

        it('should contain a data.auids property that is a string', function () {
            expect(typeof requestObject.data.auids).to.be.string;
        });

        it('should contain a data.auids property that is a comma separated string', function () {
            expect(requestObject.data.auids.indexOf(',') >= 0).to.be.true;
        });

        it('should contain a data.a u property', function () {
            expect(requestObject.data.u).to.exist;
        });

        it('should contain a data.u property that is a string', function () {
            expect(typeof requestObject.data.u === 'string').to.be.true;
        });

        it('should contain a data.pt property', function () {
            expect(requestObject.data.pt).to.exist;
        });
        
        it('should contain a data.pt property that is a string', function () {
            expect(typeof requestObject.data.pt === 'string').to.be.true;
        });

        it('should contain a data.pt property with a value of "net"', function () {
            expect(requestObject.data.pt.localeCompare('net') === 0).to.be.true;
        });

        it('should contain a callbackId property', function () {
            expect(requestObject.callbackId).to.exist;
        });

        it('should contain a callbackId property', function () {
            expect(typeof requestObject.callbackId === 'string').to.be.true;
        });

        it('should contain a data.cb u property', function () {
            expect(requestObject.data.u).to.exist;
        });

        it('should contain a data.cb property that is a string', function () {
            expect(typeof requestObject.data.u === 'string').to.be.true;
        });
        /* -----------------------------------------------------------------------*/

    /* ---------- IF MRA, generate a single request for each parcel ---------- */
    } else {
        for (var i = 0; i < returnParcels.length; i++) {
            requestObject = partnerModule.generateRequestObj([returnParcels[i]]);

            /* Simple type checking, should always pass */
            it('MRA - should return a correctly formatted object', function () {
                var result = inspector.validate({
                    type: 'object',
                    strict: true,
                    properties: {
                        url: {
                            type: 'string',
                            minLength: 1
                        },
                        data: {
                            type: 'object'
                        },
                        callbackId: {
                            type: 'string',
                            minLength: 1
                        }
                    }
                }, requestObject);

                expect(result.valid).to.be.true;
            });

            /* Test that the generateRequestObj function creates the correct object by building a URL
                * from the results. This is the bid request url that wrapper will send out to get demand
                * for your module.
                *
                * The url should contain all the necessary parameters for all of the request parcels
                * passed into the function.
                */

            /* ---------- ADD MORE TEST CASES TO TEST AGAINST REAL VALUES ------------*/
            it('should correctly build a url', function () {
                /* Write unit tests to verify that your bid request url contains the correct
                    * request params, url, etc.
                    */
                expect(requestObject).to.exist;
            });
            /* -----------------------------------------------------------------------*/
        }
    }

});