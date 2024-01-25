import type { Server, ServerWebSocket } from "bun";
import { DataZoneClient, GetUserProfileCommand, GetDomainCommand, UserProfileType } from "@aws-sdk/client-datazone";

console.log(process.env.AWS_ACCESS_KEY_ID)
console.log(process.env.AWS_SECRET_ACCESS_KEY)
export interface DataZoneException {
  name: string;
  $fault: string;
  $metadata: Metadata;
}

export interface Metadata {
  httpStatusCode: number;
  requestId: string;
  cfId: string;
  attempts: number;
  totalRetryDelay: number;
}

const DatazoneDomain = `dzd_67mbf8j5slow89`;
const config = {
  credentials: {
    accessKeyId: process.env.ACCESS || `No value for ACCESS env var`,
    secretAccessKey: process.env.SECRET || `no value for SECRET env var`,
  },
  region: "us-east-2",
}

const wsResponse = {
  async open(ws: ServerWebSocket): Promise<void> {
    console.log("WebSocket opened");
  },
  async message(ws: ServerWebSocket, message: string): Promise<void> {
    console.log("WebSocket message", message);
  },
  async close(ws: ServerWebSocket, code: number, reason?: string): Promise<void> {
    console.log("WebSocket closed", { code, reason });
  },
}

export default {
  async fetch(request: Request, server: Server): Promise<Response | undefined> {
    console.log("Request", {
      url: request.url,
      method: request.method,
      headers: request.headers.toJSON(),
      body: request.body ? await request.text() : null,
    });
    if (server.upgrade(request)) {
      console.log("WebSocket upgraded");
      return;
    }
    try {
      const username = request.headers.get("x-datazone-user") || "";
      console.log(`username: ${username}`)
      const userId = await getDatazoneUserId(username);
      console.log(`userId: ${userId}`)
      const userResponse = {
        "X-Hasura-User-Id": username,
        "X-Hasura-Datazone-User-Id": userId,
        "X-Hasura-Role": "datazoneuser",
      };
      console.log(`userResponse: ${JSON.stringify(userResponse)}`)
      return makeSuccessResponse(userResponse);
    } catch (err) {
      const noDZUserResponse = {
        "X-Hasura-User-Id": "n.a",
        "X-Hasura-Datazone-User-Id": `n.a`,
        "X-Hasura-Role": "anonymous",
      };
      return makeSuccessResponse(noDZUserResponse);
    }
  },
  websocket: wsResponse
};

export const getDatazoneUserId = async (username: string, domainId = DatazoneDomain): Promise<string> => {
  const client = new DataZoneClient(config);
  const input = {
    domainIdentifier: domainId,
    userIdentifier: username,
    type: UserProfileType.SSO,
  };
  try {
    console.log(`input: ${JSON.stringify(input)}`)
    const command = new GetUserProfileCommand(input);
    const user = await client.send(command);
    console.log(`user: ${JSON.stringify(user)}`)
    return user?.id || `n/a`;
  } catch (err: unknown) {
    console.log(`THROWING ERROR in getDatazoneUserId`);
    throw err;
  }
}





export const makeSuccessResponse = (data: object): Response => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const makeFailResponse = (): Response => {
  return new Response(JSON.stringify({ "x-not-allowed": "Datazone user not found" }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

