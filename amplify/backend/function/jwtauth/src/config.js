/* Amplify Params - DO NOT EDIT
	AUTH_TESTCDN1312A87F_USERPOOLID
	ENV
	REGION
	STORAGE_TESTAPPMEDIA_BUCKETNAME
Amplify Params - DO NOT EDIT */

const fetch = require("node-fetch");

const config = {};

async function getJWKS() {
  try {
    const response = await fetch(
      "https://cognito-idp.us-west-2.amazonaws.com/us-west-2_tVx6S8Kc4/.well-known/jwks.json"
    );
    const data = await response.json();
    return data;
  } catch (_e) {
    console.error(_e);
    return Promise.reject(_e);
  }
}

const cognitoJWKS = getJWKS()

config.REGION = process.env.AWS_REGION;
config.USERPOOLID = process.env.AUTH_TESTCDN1312A87F_USERPOOLID;
config.JWKS = cognitoJWKS;
module.exports = config;

/// version 0.1.7
