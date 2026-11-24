package com.ccards.api.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import com.ccards.api.repository.LoyaltyCard;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitArray;
import com.google.zxing.common.BitMatrix;

/** Draws a card's number as a barcode image. Knows nothing about HTTP. */
@Service
public class BarcodeService {

	/** Bar height in modules for the one-dimensional codes; QR codes are square. */
	private static final int BAR_HEIGHT = 50;

	/** Pixels per module in a PNG: a whole number, so bars stay sharp and scannable. */
	private static final int PIXELS_PER_MODULE = 8;

	public byte[] render(LoyaltyCard card, ImageFormat format) {
		BitMatrix matrix = encode(card);
		return switch (format) {
			case PNG -> toPng(matrix);
			case SVG -> toSvg(matrix).getBytes(StandardCharsets.UTF_8);
		};
	}

	private static BitMatrix encode(LoyaltyCard card) {
		// The enum constants share their names with ZXing's formats.
		BarcodeFormat format = BarcodeFormat.valueOf(card.getBarcodeType().name());
		boolean qr = format == BarcodeFormat.QR_CODE;
		int height = qr ? 0 : BAR_HEIGHT;
		// ZXing's QR default is ISO-8859-1, which turns other characters into '?' without an error.
		Map<EncodeHintType, ?> hints = qr ? Map.of(EncodeHintType.CHARACTER_SET, "UTF-8") : Map.of();
		try {
			// Width and height 0 (or less than needed) give the natural size, quiet zone included.
			return new MultiFormatWriter().encode(card.getCardNumber(), format, 0, height, hints);
		}
		catch (WriterException | IllegalArgumentException ex) {
			throw new BarcodeNotRenderableException(card.getId(), ex);
		}
	}

	private static byte[] toPng(BitMatrix matrix) {
		int width = matrix.getWidth() * PIXELS_PER_MODULE;
		int height = matrix.getHeight() * PIXELS_PER_MODULE;
		BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_BYTE_BINARY);
		for (int y = 0; y < height; y++) {
			for (int x = 0; x < width; x++) {
				boolean dark = matrix.get(x / PIXELS_PER_MODULE, y / PIXELS_PER_MODULE);
				image.setRGB(x, y, dark ? 0xFF000000 : 0xFFFFFFFF);
			}
		}
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		try {
			ImageIO.write(image, "png", out);
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
		return out.toByteArray();
	}

	/**
	 * One path of dark rectangles on a white background. The size is in modules (the {@code viewBox}),
	 * so the client scales it. Only numbers and constants are written, never the card number.
	 */
	private static String toSvg(BitMatrix matrix) {
		int width = matrix.getWidth();
		int height = matrix.getHeight();
		StringBuilder path = new StringBuilder();
		int top = 0;
		while (top < height) {
			BitArray row = matrix.getRow(top, null);
			// A 1D barcode repeats one row; draw such a block of equal rows once.
			int bottom = top + 1;
			while (bottom < height && matrix.getRow(bottom, null).equals(row)) {
				bottom++;
			}
			for (int x = 0; x < width; x++) {
				if (!row.get(x)) {
					continue;
				}
				int start = x;
				while (x + 1 < width && row.get(x + 1)) {
					x++;
				}
				int length = x - start + 1;
				path.append('M').append(start).append(' ').append(top)
					.append('h').append(length)
					.append('v').append(bottom - top)
					.append('h').append(-length)
					.append('z');
			}
			top = bottom;
		}
		return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 " + width + " " + height
				+ "\" shape-rendering=\"crispEdges\"><rect width=\"" + width + "\" height=\"" + height
				+ "\" fill=\"#fff\"/><path fill=\"#000\" d=\"" + path + "\"/></svg>";
	}

}
