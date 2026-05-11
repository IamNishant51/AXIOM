declare module "ink-image" {
	import React from "react";

	interface ImageProps {
		src: string;
		width?: number;
		height?: number;
		preserveAspectRatio?: boolean;
	}

	const Image: React.FC<ImageProps>;
	export default Image;
}