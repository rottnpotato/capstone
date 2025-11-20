import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { Server, ServerOptions } from 'socket.io';
import { NextApiResponse } from 'next';

type Res = NextApiResponse & {
  socket: {
    server: (HttpServer | HttpsServer) & {
      io?: Server;
    };
  };
};

export let io: Server;

export const initSocket = (res: Res, options?: Partial<ServerOptions>): Server => {
  if (!res.socket.server.io) {
    res.socket.server.io = new Server(res.socket.server, options);
  }
  io = res.socket.server.io;
  return io;
};
