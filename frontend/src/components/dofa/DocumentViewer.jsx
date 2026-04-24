export default function DocumentViewer({file,close}){
if (!file) return null;
const BASE_URL = import.meta.env.VITE_API_URL;

return(

<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">

<div className="bg-white w-3/4 h-3/4 rounded-lg p-4 relative">

<button
onClick={close}
className="absolute top-4 right-4"
>
✕
</button>

<iframe
src={`${BASE_URL}/${file}`}
title="Document"
className="w-full h-full"
/>

<a
href={`${BASE_URL}/${file}`}
download
className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded"
>
Download
</a>

</div>

</div>

)

}