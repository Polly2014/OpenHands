// © Microsoft Corporation. All rights reserved.

const redirectUri = typeof window !== 'undefined' ? window.location.href : "http://localhost:3000";
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: "0c07597e-5da3-43b5-8d45-75856e6ad7f8",
        authority: "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47",
        redirectUri,
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
    }
};

const msalInstance = new PublicClientApplication(msalConfig);

export { msalInstance, redirectUri };
