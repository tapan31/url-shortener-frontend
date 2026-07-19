import AppRouter, { SubDomainRouter } from "../AppRouter";

// For no subdomain, we will use the approuter and its the main configuration of the app
// For subdomain, we will use the subdomain router and its not the main config of the app

export const subDomainList = [
  { suddomain: "www", app: AppRouter, main: true },
  { subdomain: "url", app: SubDomainRouter, main: false },
];
