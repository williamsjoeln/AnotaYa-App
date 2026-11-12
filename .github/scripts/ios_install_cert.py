import os
import base64
import subprocess
import sys

def main():
    p = os.environ.get('P12_PASSWORD', '')
    c = os.environ.get('BUILD_CERTIFICATE_BASE64', '').strip().replace('\r', '').replace('\n', '')
    pp = os.environ.get('BUILD_PROVISION_PROFILE_BASE64', '').strip().replace('\r', '').replace('\n', '')
    cert_path = os.environ.get('CERT_PATH')
    pp_path = os.environ.get('PP_PATH')

    print(f"::notice::P12_PASSWORD len: {len(p)} | CERT_BASE64 len: {len(c)} | PP_BASE64 len: {len(pp)}")

    if not c or not cert_path:
        print("ERROR: Certificate data or path missing")
        sys.exit(1)

    try:
        cert_bytes = base64.b64decode(c)
        with open(cert_path, 'wb') as f:
            f.write(cert_bytes)
        print(f"Saved certificate: {len(cert_bytes)} bytes")
    except Exception as e:
        print(f"ERROR decoding certificate base64: {e}")
        sys.exit(1)

    if pp and pp_path:
        try:
            pp_bytes = base64.b64decode(pp)
            with open(pp_path, 'wb') as f:
                f.write(pp_bytes)
            print(f"Saved provisioning profile: {len(pp_bytes)} bytes")
        except Exception as e:
            print(f"ERROR decoding provisioning profile base64: {e}")
            sys.exit(1)

    # Test password with openssl
    test_ssl = subprocess.run(
        ['openssl', 'pkcs12', '-info', '-in', cert_path, '-passin', 'env:P12_PASSWORD', '-noout'],
        capture_output=True,
        text=True
    )
    print("OpenSSL returncode:", test_ssl.returncode)
    if test_ssl.returncode != 0:
        print(f"::error::Contraseña o formato p12 inválido: {test_ssl.stderr.strip()}")
    else:
        print("✅ OpenSSL verified certificate with password successfully!")

if __name__ == '__main__':
    main()
