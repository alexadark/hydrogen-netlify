import {useLoaderData} from '@remix-run/react';
import {json} from '@netlify/remix-runtime';
import {Image, Money, ShopPayButton} from '@shopify/hydrogen';
import {AddToCartButton} from '~/components/cart';

const seo = ({data}) => ({
  title: data?.product?.title,
  description: data?.product?.description,
});
export const handle = {
  seo,
};

export const loader = async ({params, context, request}) => {
  const {handle} = params;
  const searchParams = new URL(request.url).searchParams;
  const selectedOptions = [];

  // set selected options from the query string
  searchParams.forEach((value, name) => {
    selectedOptions.push({name, value});
  });

  const {product} = await context.storefront.query(PRODUCT_QUERY, {
    variables: {
      handle,
      selectedOptions,
    },
  });

  if (!product?.id) {
    throw new Response(null, {status: 404});
  }

  // optionally set a default variant so you always have an "orderable" product selected
  const selectedVariant =
    product.selectedVariant ?? product?.variants?.nodes[0];
  const storeDomain = context.storefront.getShopifyDomain();

  return json({
    product,
    selectedVariant,
    storeDomain,
  });
};

export default function ProductHandle() {
  const {product, selectedVariant, storeDomain} = useLoaderData();
  const orderable = selectedVariant?.availableForSale || false;
  const productImage = selectedVariant.image
    ? selectedVariant.image
    : product.featuredImage;

  return (
    <section className="grid center-container m ">
      <div className="grid items-start gap-6 lg:gap-20 lg:grid-cols-3">
        <div className=" md:grid-flow-row md:p-0 md:overflow-x-hidden md:w-full lg:col-span-2">
          <div className="lg:w-[700px]">
            {productImage && (
              <Image data={productImage} width={700} alt={product.title} />
            )}
          </div>
        </div>
        <div className="md:sticky md:mx-auto max-w-xl md:max-w-[24rem] grid gap-8 p-0 md:p-6 md:px-0 top-[6rem] lg:top-[8rem] xl:top-[10rem]">
          <div className="grid gap-2">
            <h1 className="text-4xl font-bold leading-10 whitespace-normal">
              {product.title}
            </h1>
          </div>

          <Money
            withoutTrailingZeros
            data={selectedVariant.price}
            className="mb-2 text-xl font-semibold"
          />
          {orderable && (
            <div className="space-y-2">
              <ShopPayButton
                variantIds={[selectedVariant?.id]}
                storeDomain={storeDomain}
                width={'400px'}
                className="mb-3"
              />
              <AddToCartButton
                variantId={selectedVariant?.id}
                style="w-full mt-2"
              />
            </div>
          )}

          <div
            className="pt-6 prose border-t border-gray-200 text-md"
            dangerouslySetInnerHTML={{__html: product.description}}
          />
        </div>
      </div>
    </section>
  );
}

const PRODUCT_QUERY = `#graphql
  query product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
    product(handle: $handle) {
      id
      title
      handle
      vendor
      description
      featuredImage{
        id
        url
        altText
        height
        width
      }

      options {
        name,
        values
      }
      selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
        product {
          title
          handle
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
          price {
            currencyCode
            amount
          }
          compareAtPrice {
            currencyCode
            amount
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;
