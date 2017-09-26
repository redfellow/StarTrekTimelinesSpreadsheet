// an implemention of NetworkInterface using the native browser fetch functionality
import { NetworkInterface } from "./NetworkInterface";
import 'url-search-params-polyfill';

export class NetworkFetch implements NetworkInterface {
	post(uri: string, form: any, bearerToken: string | undefined = undefined, getjson: boolean = true): Promise<any> {
		let searchParams: URLSearchParams = new URLSearchParams();
		for (const prop of Object.keys(form)) {
			searchParams.set(prop, form[prop]);
		}

		let headers: any = {
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		};

		if (bearerToken !== undefined) {
			headers.Authorization = "Bearer " + btoa(bearerToken);
		}

		let promiseFetch = window.fetch(uri, {
			method: "post",
			headers: headers,
			body: searchParams
		});

		if (getjson) {
			return promiseFetch.then((response: Response) => response.json());
		} else {
			return promiseFetch.then((response: Response) => response.text());
		}
	}

	postjson(uri: string, form: any): Promise<any> {
		let headers: any = {
			"Content-type": "application/json"
		};

		let promiseFetch = window.fetch(uri, {
			method: "post",
			headers: headers,
			body: JSON.stringify(form)
		});

		return promiseFetch.then((response: Response) => response.text());
	}

	get(uri: string, qs: any): Promise<any> {
		let searchParams: URLSearchParams = new URLSearchParams();
		for (const prop of Object.keys(qs)) {
			if (Array.isArray(qs[prop])) {
				qs[prop].forEach((entry: any): void => {
					searchParams.append(prop + '[]', entry);
				});
			}
			else {
				searchParams.set(prop, qs[prop]);
			}
		}

		return window.fetch(uri + "?" + searchParams.toString()).then((response: Response) => response.json());
	}
}