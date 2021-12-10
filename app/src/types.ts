export type AuthorityType = {
  doc: any;
  steps: Array<any>;
  stepClientIDs: Array<any>;
  onNewSteps: Array<any>;
  stepsSince: (version: any) => {
      steps: Array<any>,
      clientIDs: Array<any>
  };
  receiveSteps: (version:any, steps: any, clientID: any) => void;
};
