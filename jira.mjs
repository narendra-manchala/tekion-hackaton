import axios from "axios";
import "dotenv/config";

const versionId = 'Release-2024.08.1.0';
const projectKey = 'GMDRP';
const jiraBaseUrl = 'https://tekion.atlassian.net/rest/api/3/search';
const jiraAuth = Buffer.from(process.env.JIRA_TOKEN).toString('base64');

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