import { each, set } from 'lodash';
import joi2Swagger from 'joi-to-swagger';
import httpStatus from 'http-status-codes';

const PATH_DELIMITER = '/';
const PARAM_DELIMITER = ':';
const SCHEMA_TYPES = {
	RESPONSE_BODY: 'responseBody',
	REQUEST_BODY: 'requestBody'
};
const { REQUEST_BODY, RESPONSE_BODY } = SCHEMA_TYPES;
const { OK, CREATED, BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = httpStatus;
const OPEN_API_VERSION = '3.0.0';
export default () => (routes, { title, description, contact, version }) => {
	const components = getComponents(routes, '', {});
	const paths = getPaths(routes, components);
	return {
		openapi: OPEN_API_VERSION,
		info: {
			title,
			description,
			contact,
			version
		},
		paths,
		components
	};
};

const simplePathParam = (name) => ({
	name,
	in: 'path',
	description: `${name} path param`,
	required: true,
	style: 'simple',
	schema: {
		type: 'string'
	}
});

const getPathParams = (path) => {
	const params = [];
	const parts = path.split(PATH_DELIMITER);
	parts.forEach((part) => {
		if (part[0] === PARAM_DELIMITER) {
			params.push(part.substring(1));
		}
	});
	return params.map(simplePathParam);
};

const formatPathParams = (path) => {
	return path
		.split(PATH_DELIMITER)
		.map((part) => part[0] === PARAM_DELIMITER ? `{${part.substring(1)}}` : part)
		.join(PATH_DELIMITER);
};

const jsonSchema = (schema, description) => ({
	description,
	content: {
		'application/json': {
			'schema': {
				'$ref': `#/components/schemas/${schema}`
			}
		}
	}
});
const DEFAULT_RESPONSES = {
	[BAD_REQUEST]: {},
	[UNAUTHORIZED]: {},
	[INTERNAL_SERVER_ERROR]: {}
};

const requestBody = (schema) => `${schema}-${REQUEST_BODY}`;

const responseBody = (schema) => `${schema}-${RESPONSE_BODY}`;

const formatters = {
	get: (schema) => ({
		responses: {
			[OK]: jsonSchema(`${responseBody(schema)}`),
			...DEFAULT_RESPONSES
		}
	}),
	put: (schema) => ({
		requestBody: jsonSchema(`${requestBody(schema)}`),
		responses: {
			[OK]: jsonSchema(`${responseBody(schema)}`),
			...DEFAULT_RESPONSES
		}
	}),
	post: (schema) => ({
		requestBody: jsonSchema(`${requestBody(schema)}`),
		responses: {
			[CREATED]: jsonSchema(`${responseBody(schema)}`),
			...DEFAULT_RESPONSES
		}
	})
};

const formatRequestParams = (schemaName, httpMethod) => {
	if (formatters[httpMethod]) {
		return formatters[httpMethod](schemaName);
	}
};

const getPathDefinition = (route, components) => {
	const { path } = route;
	const parameters = getPathParams(path);
	const formattedPath = formatPathParams(path);
	const schemaName = getComponentName(route);
	const method = route.method.toLowerCase();
	let schemaDef = {};
	if (route.schema) {
		schemaDef = formatRequestParams(schemaName, method);
	}
	return {
		key: `${formattedPath}.${method}`,
		value: {
			summary: `${schemaName}`,
			parameters,
			...schemaDef
		}
	};
};

const getPaths = (routes, components) => {
	const paths = {};
	routes.forEach((route) => {
		routes[route.path] = routes[route.path] || {};
		const definition = getPathDefinition(route, route.path, components);
		set(paths,
			definition.key,
			definition.value);
	});
	return paths;
};

const getComponentName = (route) => {
	return route.name ? route.name : `${route.method}-${route.path.replace(/\//gi, '-')}`;
};

const getComponents = (routes, parentPath, aggregate = {}) => {
	each(routes, (route, key) => {
		if (route.schema) {
			const componentName = getComponentName(route);
			each(route.schema, (schema, type) => {
				const { swagger } = joi2Swagger(schema, aggregate);
				set(aggregate, `schemas.${componentName}-${type}`, swagger);
			});
		}
	});
	return aggregate;
};