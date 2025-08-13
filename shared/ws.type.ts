export type WSResponse = {
  id?: string;
  action: string;
  data: any;
};

export type WSRequest = {
  id?: string;
  action: string;
  payload?: any;
};
