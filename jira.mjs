import axios from "axios";
import "dotenv/config";

const versionId = 'Release-2024.08.1.0';
const projectKey = 'GMDRP';
const jiraBaseUrl = 'https://tekion.atlassian.net/rest/api/3/search';
const jiraAuth = Buffer.from(process.env.JIRA_TOKEN).toString('base64');

function removeCustomFields(array = []) {
  return array.map(item => {
      const newItem = { ...item }; 
      Object.keys(newItem).forEach(key => {
          if (key.startsWith('customfield_')) {
              delete newItem[key]; 
          }
      });
      return newItem;
  });
}

export async function fetchJira() {
    try {
        const jqlQuery = `project=${projectKey} AND fixVersion="${versionId}" `;
        const res = await axios.get(jiraBaseUrl, {
            headers: {
                'Authorization': `Basic ${jiraAuth}`,
                'Accept': 'application/json'
            },
            params: {
                jql: `https://tekion.atlassian.net/rest/api/3/search?jql=project=GMDRP&fixVersion=Release-2024.08.1.0`,
                // startAt: 0, 
                // maxResults: 20 
            }
        });
        console.log('Response Data: ---->', res.data);
        return removeCustomFields(res.data);
    } catch (error) {
        console.error('Error fetching issues:', error);
        throw new Error(error);
    }
}