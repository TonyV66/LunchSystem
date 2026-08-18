/// <reference types="react-scripts" />

declare module "*.css" {}

interface Window {
  __CAFETERIA_CONFIG__?: {
    currentDate?: string | null;
  };
}
