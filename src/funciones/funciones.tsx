export const subirACloudinary = async (file: File): Promise<string> => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "buen_sabor"); // tu carpeta en Cloudinary

    const res = await fetch("https://api.cloudinary.com/v1_1/dvyjtb1ns/image/upload", {
    method: "POST",
    body: data,
    });

    const response = await res.json();
    return response.secure_url;
};