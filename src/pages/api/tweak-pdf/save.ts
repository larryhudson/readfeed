import fs from "fs";

export const POST = async (context) => {
    const dataJson = await context.request.json();

    console.log("Updated JSON data");
    console.log(dataJson);

    const saveJsonPath = './media/pdf-extraction-json/modified.json'

    await fs.promises.writeFile(saveJsonPath, JSON.stringify(dataJson, null, 2));

    // Save it somewhere and update the contentItem so it's pointing to the modified JSON file

    return new Response("OK", { status: 200 });

}