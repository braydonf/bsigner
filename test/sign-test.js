/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */

'use strict';

const {Network, MTX} = require('bcoin');
const {DeviceManager} = require('../lib/bsigner');
const {vendors} = require('../lib/common');
const {getLogger, getTestVendors} = require('./utils/common');
const {InputData} = require('../lib/inputData');

const logger = getLogger();
const enabledVendors = getTestVendors();

describe('Sign Transaction', function () {
  this.timeout(1e7);

  const signVectors = readSignVectors('./data/signVectors.json');
  const network = signVectors.network;

  let manager = null;

  before(async () => {
    await logger.open();

    manager = DeviceManager.fromOptions({
      vendor: enabledVendors,
      network,
      logger,
      [vendors.LEDGER]: {
        timeout: 0
      }
    });

    await manager.open();

    for (const vendor of enabledVendors) {
      try {
        await manager.selectDevice(vendor);
      } catch (e) {
        throw new Error(`Could not select device for ${vendor}.`);
      }
    }
  });

  after(async () => {
    if (manager.opened)
      await manager.close();
  });

  for (const vendor of enabledVendors) {
    for (const signVector of signVectors.vectors) {
      it(`should sign ${signVector.description} (${vendor})`, async () => {
        await manager.selectDevice(vendor);

        debugger;
        const {tx, inputData} = signVector;
        const mtx = await manager.signTransaction(tx, inputData);

        mtx.check();
      });
    }
  }
});

function readSignVectors(path) {
  const json = require(path);

  json.network = Network.get(json.network);

  json.vectors = json.vectors.map((vector) => {
    vector.tx = MTX.fromRaw(Buffer.from(vector.tx, 'hex'));
    vector.inputData = vector.inputData.map(data => InputData.fromJSON(data));

    return vector;
  });

  return json;
}
