import axios from "axios";
import "dotenv/config";

const versionId = 'Release-2024.08.1.0';
const projectKey = 'GMDRP';
const jiraBaseUrl = 'https://tekion.atlassian.net/rest/api/3/search';
// const authString = 'vanshikag@tekion.com:ATATT3xFfGF0tzgBH6C5hOoog_80hNJ-kxtqAxlh0XHi62xdFztsQbU4_jF6VZoHmjlN8qj73MiKCcq4PFLiLvLsE0ru0Ugbqn3ZA74XTQLmKoIJcHhmNAfdOhjxMdMDGtWQvxNfaqyqOK2flOwjbs5aMlW1qiXnHphd1jmfHDbMT9f-9KyDbg4=25F0DD4B';
// const jiraAuth = Buffer.from(authString).toString('base64');
const jiraAuth = Buffer.from(process.env.JIRA_AUTH_TOKEN).toString('base64');

export async function fetchJira() {
    try {
        const jqlQuery = `project=${projectKey} AND fixVersion="${versionId}" `;
        const res = await axios.get(jiraBaseUrl, {
            headers: {
                'Authorization': `Basic ${jiraAuth}`,
                'Accept': 'application/json'
            },
            params: {
                jql: jqlQuery,
                startAt: 0, 
                maxResults: 20 
            }
        });
        console.log('Response Data:', res.data);
        return res.data;
    } catch (error) {
        console.error('Error fetching issues:', error);
        throw new Error(error);
    }
}