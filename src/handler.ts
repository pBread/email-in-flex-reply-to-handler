import dotenv from "dotenv";
import type { Request, Response } from "express";
import twilio from "twilio";

dotenv.config();
const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

export async function handler(req: Request, res: Response) {
  const end = () => res.send();

  // check to make sure the event type is "onParticipantAdd"
  if (req.body.EventType !== "onParticipantAdded") return end();
  const body = req.body as PostOnParticipantAdd;

  // check if this participant was added via email channel
  if (body.Source !== "EMAIL") return end();

  // check if name contains reply-to
  const replyTo = getReplyToFromName(body["MessagingBinding.Name"]);
  if (!replyTo) return end();

  // Remove Previous & Add New Participant
  await removeAndAddParticipants(
    body.ConversationSid,
    body.ParticipantSid,
    replyTo[0]
  );

  end();
}

type PostOnParticipantAdd = {
  "MessagingBinding.Address": string;
  "MessagingBinding.Level": string;
  "MessagingBinding.Name": string;
  "MessagingBinding.Type": string;
  AccountSid: string;
  Attributes: string;
  ChatServiceSid: string;
  ConversationSid: string;
  DateCreated: string;
  EventType: string;
  ParticipantSid: string;
  RetryCount: string;
  RoleSid: string;
  Source: string;
};

function getReplyToFromName(name: string): string[] | null {
  // if (name === "YOUR NAME") return ["your-reply-to-email@example.com"];

  const re = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const emails = name.match(re);
  return emails;

  /****************************************************
    // TEST CASES
  
    let re = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    let testCases = [];
    let expectedResults = [];
  
    testCases.push("Robert Hansen (reply-to: peter@example.com)");
    expectedResults.push(["peter@example.com"]);
  
    testCases.push(
      "Robert Hansen (reply-to: peter@example.com, susan@example.com)"
    );
    expectedResults.push(["peter@example.com", "susan@example.com"]);
  
    testCases.push("Robert Hansen (reply-to: peter.parker@example.tester.com)");
    expectedResults.push(["peter.parker@example.tester.com"]);
  
    testCases.push("Robert Hansen (reply-to: peter@example.org)");
    expectedResults.push(["peter@example.org"]);
  
    testCases.push("Robert Hansen");
    expectedResults.push(null);
  
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const expectedResult = expectedResults[i];
      const isValid = `${testCase.match(re)}` === `${expectedResult}`;
  
      if (!isValid) console.error({ isValid, testCase, expectedResult });
      else console.log({ isValid, testCase, expectedResult });
    }
    ****************************************************/
}

async function removeAndAddParticipants(
  conversationSid: string,
  participantSid: string,
  replyTo: string
) {
  const prevParticipant = await client.conversations.v1
    .conversations(conversationSid)
    .participants(participantSid)
    .fetch();

  await client.conversations
    .conversations(conversationSid)
    .participants(participantSid)
    .remove();

  await client.conversations.v1
    .conversations(conversationSid)
    .participants.create({
      messagingBinding: {
        ...prevParticipant.messagingBinding,
        address: replyTo,
      },
    });
}
