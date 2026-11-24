package com.ccards.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.stream.Stream;

import javax.imageio.ImageIO;
import javax.xml.parsers.DocumentBuilderFactory;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;
import org.w3c.dom.Element;
import org.xml.sax.InputSource;

import com.ccards.api.repository.BarcodeType;
import com.ccards.api.repository.LoyaltyCard;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

class BarcodeServiceTests {

	private final BarcodeService service = new BarcodeService();

	static Stream<Arguments> cards() {
		return Stream.of(
				Arguments.of(BarcodeType.EAN_13, "4006381333931", BarcodeFormat.EAN_13),
				Arguments.of(BarcodeType.EAN_8, "96385074", BarcodeFormat.EAN_8),
				Arguments.of(BarcodeType.UPC_A, "036000291452", BarcodeFormat.UPC_A),
				Arguments.of(BarcodeType.CODE_128, "ABC-123 xyz", BarcodeFormat.CODE_128),
				Arguments.of(BarcodeType.QR_CODE, "https://example.com/card?id=42", BarcodeFormat.QR_CODE));
	}

	@ParameterizedTest
	@MethodSource("cards")
	void pngReadsBackAsTheCardNumber(BarcodeType type, String number, BarcodeFormat expected) throws Exception {
		byte[] png = service.render(card(type, number), ImageFormat.PNG);

		Result result = read(ImageIO.read(new ByteArrayInputStream(png)));
		assertThat(result.getText()).isEqualTo(number);
		assertThat(result.getBarcodeFormat()).isEqualTo(expected);
	}

	@ParameterizedTest
	@MethodSource("cards")
	void svgIsWellFormedAndScalable(BarcodeType type, String number) throws Exception {
		String svg = new String(service.render(card(type, number), ImageFormat.SVG), StandardCharsets.UTF_8);

		Element root = DocumentBuilderFactory.newInstance()
			.newDocumentBuilder()
			.parse(new InputSource(new StringReader(svg)))
			.getDocumentElement();
		assertThat(root.getTagName()).isEqualTo("svg");
		assertThat(root.getAttribute("viewBox")).matches("0 0 \\d+ \\d+");
		assertThat(root.hasAttribute("width")).isFalse();
		assertThat(svg).doesNotContain(number);
	}

	@Test
	void qrCodeKeepsNonLatinText() throws Exception {
		String number = "Zażółć € 日本";

		byte[] png = service.render(card(BarcodeType.QR_CODE, number), ImageFormat.PNG);

		assertThat(read(ImageIO.read(new ByteArrayInputStream(png))).getText()).isEqualTo(number);
	}

	@Test
	void numberThatTheTypeCannotEncodeIsNotRenderable() {
		LoyaltyCard card = card(BarcodeType.CODE_128, "café €");

		assertThatThrownBy(() -> service.render(card, ImageFormat.PNG))
			.isInstanceOf(BarcodeNotRenderableException.class)
			.hasMessageContaining(card.getId().toString())
			.hasMessageNotContaining("caf");
	}

	@Test
	void parsesTheFormatParameterIgnoringCase() {
		assertThat(ImageFormat.fromParameter("png")).isEqualTo(ImageFormat.PNG);
		assertThat(ImageFormat.fromParameter("SVG")).isEqualTo(ImageFormat.SVG);
		assertThatThrownBy(() -> ImageFormat.fromParameter("gif")).isInstanceOf(UnsupportedFormatException.class);
	}

	private static LoyaltyCard card(BarcodeType type, String number) {
		LoyaltyCard card = new LoyaltyCard("Shop", "Shop", number, type, UUID.randomUUID());
		ReflectionTestUtils.setField(card, "id", UUID.randomUUID());
		return card;
	}

	private static Result read(BufferedImage image) throws Exception {
		int[] pixels = image.getRGB(0, 0, image.getWidth(), image.getHeight(), null, 0, image.getWidth());
		var source = new RGBLuminanceSource(image.getWidth(), image.getHeight(), pixels);
		return new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(source)));
	}

}
