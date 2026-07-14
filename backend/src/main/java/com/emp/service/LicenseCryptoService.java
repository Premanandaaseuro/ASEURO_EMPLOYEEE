package com.emp.service;

import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

@Service
public class LicenseCryptoService {

    private static final String ALGORITHM = "RSA";
    private static final String SIGNATURE_ALGORITHM = "SHA256withRSA";

    /**
     * Generates a 2048-bit RSA KeyPair.
     */
    public KeyPair generateKeyPair() {
        try {
            KeyPairGenerator keyPairGen = KeyPairGenerator.getInstance(ALGORITHM);
            keyPairGen.initialize(2048);
            return keyPairGen.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Failed to initialize KeyPairGenerator for RSA", e);
        }
    }

    /**
     * Converts a PrivateKey to PEM String format.
     */
    public String privateKeyToPem(PrivateKey privateKey) {
        String base64Key = Base64.getMimeEncoder().encodeToString(privateKey.getEncoded());
        return "-----BEGIN PRIVATE KEY-----\n" + base64Key + "\n-----END PRIVATE KEY-----";
    }

    /**
     * Converts a PublicKey to PEM String format.
     */
    public String publicKeyToPem(PublicKey publicKey) {
        String base64Key = Base64.getMimeEncoder().encodeToString(publicKey.getEncoded());
        return "-----BEGIN PUBLIC KEY-----\n" + base64Key + "\n-----END PUBLIC KEY-----";
    }

    /**
     * Reconstructs a PrivateKey object from its PEM string.
     */
    public PrivateKey pemToPrivateKey(String pem) {
        try {
            String cleanedPem = pem.replace("-----BEGIN PRIVATE KEY-----", "")
                                   .replace("-----END PRIVATE KEY-----", "")
                                   .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(cleanedPem);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
            KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
            return kf.generatePrivate(spec);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load PrivateKey from PEM", e);
        }
    }

    /**
     * Reconstructs a PublicKey object from its PEM string.
     */
    public PublicKey pemToPublicKey(String pem) {
        try {
            String cleanedPem = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                                   .replace("-----END PUBLIC KEY-----", "")
                                   .replaceAll("\\s", "");
            byte[] decoded = Base64.getDecoder().decode(cleanedPem);
            X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
            KeyFactory kf = KeyFactory.getInstance(ALGORITHM);
            return kf.generatePublic(spec);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load PublicKey from PEM", e);
        }
    }

    /**
     * Signs a message using SHA256withRSA and the given PrivateKey.
     * Returns a Base64-encoded signature.
     */
    public String sign(String message, PrivateKey privateKey) {
        try {
            Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);
            signature.initSign(privateKey);
            signature.update(message.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = signature.sign();
            return Base64.getEncoder().encodeToString(signatureBytes);
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign message", e);
        }
    }

    /**
     * Verifies a SHA256withRSA signature against a message using a PublicKey.
     */
    public boolean verify(String message, String base64Signature, PublicKey publicKey) {
        try {
            Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);
            signature.initVerify(publicKey);
            signature.update(message.getBytes(StandardCharsets.UTF_8));
            byte[] signatureBytes = Base64.getDecoder().decode(base64Signature);
            return signature.verify(signatureBytes);
        } catch (Exception e) {
            return false;
        }
    }
}
