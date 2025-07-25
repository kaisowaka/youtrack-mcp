#!/usr/bin/env node

import { YouTrackClient } from '../src/youtrack-client.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkYTMIssues() {
  const client = new YouTrackClient(process.env.YOUTRACK_URL!, process.env.YOUTRACK_TOKEN!);
  const result = await client.queryIssues('project: YTM', 'id,summary', 5);
  console.log('Issues found:', result.content[0].text);
}

checkYTMIssues().catch(console.error);
