import { Request, Response } from "express";
import { ViewNameLookup } from "./lookups/routingLookup";
import { Resources, ResourceKey } from "../resourceLookup";
import * as ProductsQuery from "./commands/products/productsQuery";
import * as EmployeeQuery from "./commands/employees/employeeQuery";
import { CommandResponse, Product, ProductListingPageResponse } from "./typeDefinitions";

const processStartProductListingError = (error: any, res: Response): void => {
	res.setHeader(
		"Cache-Control",
		"no-cache, max-age=0, must-revalidate, no-store");

	return res.status((error.status || 500))
		.render(
			ViewNameLookup.ProductListing,
			<ProductListingPageResponse>{
				products: [],
				isElevatedUser: false,
				errorMessage: (error.message
					|| Resources.getString(ResourceKey.PRODUCTS_UNABLE_TO_QUERY))
			});
};

export const start = async (req: Request, res: Response): Promise<void> => {
	return ProductsQuery.query()
	.then((productsCommandResponse: CommandResponse<Product[]>): CommandResponse<Product[]> => {
		res.setHeader(
			"Cache-Control",
			"no-cache, max-age=0, must-revalidate, no-store");

		return productsCommandResponse}).then(async (productValues: any) => {
			await EmployeeQuery.isElevatedUser().then((employeeCommandResponse: CommandResponse<boolean>): void => {
				return res.render(ViewNameLookup.ProductListing, (<ProductListingPageResponse>{
					products: productValues.data,
					isElevatedUser: employeeCommandResponse.data
				}));
			});
			
		}).catch((error: any): void => {
			return processStartProductListingError(error, res);
		});		
};