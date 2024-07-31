import { ImageType } from "@/interfaces/editor/image_type";
import { PromptData } from "@/interfaces/editor/prompt_data";
import { Message } from "@/interfaces/turing/message";
import { Agent } from "@/interfaces/turing/agent";

export class ApiService {
    static BASE_URL: string = process.env.NEXT_PUBLIC_API_URL as string;

    static async fetchData(endpoint: string, method: string, body?: any, headers?: HeadersInit) {
        try {
            const url = `${ApiService.BASE_URL}/${endpoint}/`;
            const fetchOptions: RequestInit = { method };
            if (headers) {
                fetchOptions.headers = headers;
            }
            if (body) {
                fetchOptions.body = body;
            }
    
            const response = await fetch(url, fetchOptions);
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response;
        } 
        catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    };

    static async testConnection() {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const response = await ApiService.fetchData('', 'GET', null, headers);
        return response.json();
    }

    // Image Editor Requests

    static async testAiConnection() {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const response = await ApiService.fetchData('editor/test', 'GET', null, headers);
        return response.json();
    }


    static async sendImageRequest(imageFile: File, promptData: PromptData) {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        const body = new FormData();
        body.append('image', imageFile);
        body.append('prompt', promptData.prompt);
        body.append('strength', promptData.strength.toString());
        body.append('style_preset', promptData.style_preset || '');
        body.append('cfg_scale', promptData.cfg_scale.toString());
        const response = await ApiService.fetchData('editor/edit', 'POST', body, headers);
        return response.json();
    }


    static async getImageRequest(imageId: string, imageType: ImageType, isEdited: boolean, isFramed: boolean) {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const rawImageResponse = await ApiService.fetchData(`storage/get/${imageId}/${imageType}/${isEdited}/${isFramed}`, 'GET', null, headers);
        return rawImageResponse.text();
    }

    // Reverse Turing Test Requests

    static async sendGPTRequest(messages: Message[], agent: Agent, other_agents: Agent[]) {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify({ messages, agent, other_agents });
        const response = await ApiService.fetchData('turing/gpt/message', 'POST', body, headers);
        return response.json();
    }

    static async getGPTGuess(messages: Message[], agent: Agent, other_agents: Agent[]) {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify({ messages, agent, other_agents });
        const response = await ApiService.fetchData('turing/gpt/guess', 'POST', body, headers);
        return response.json();
    }

    static async sendGeminiRequest(messages: Message[], agent: Agent, other_agents: Agent[]) {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify({ messages, agent, other_agents });
        const response = await ApiService.fetchData('turing/gemini/message', 'POST', body, headers);
        return response.json();
    }

    static async getGeminiGuess(messages: Message[], agent: Agent, other_agents: Agent[]) {
        const headers = new Headers();
        headers.append('Access-Control-Allow-Origin', '*');
        headers.append('Content-Type', 'application/json');
        const body = JSON.stringify({ messages, agent, other_agents });
        const response = await ApiService.fetchData('turing/gemini/guess', 'POST', body, headers);
        return response.json();
    }

}
