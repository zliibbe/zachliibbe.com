import { NextResponse } from "next/server";

// Specify Edge runtime
export const runtime = "edge";

export async function GET() {
  try {
    const lambdaUrl = process.env.GOODREADS_LAMBDA_URL;
    if (!lambdaUrl) {
      throw new Error("GOODREADS_LAMBDA_URL is not configured");
    }

    // Log the environment and URL we're calling
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Calling Lambda function at: ${lambdaUrl}`);

    const response = await fetch(lambdaUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Log the response status
    console.log(`Lambda response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(
        `Lambda returned ${response.status}: ${await response.text()}`
      );
    }

    const data = await response.json();
    console.log("Lambda response data:", data);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching Goodreads data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Goodreads data" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}
