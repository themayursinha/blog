---
layout: post
title: IPSec: Site to Site - Grand Task
categories: [Network Security]
tags: [netsec]
---

![ipsec-site-to-site]({{site.url}}/img/ipsec-site-to-site.png)

# NTP Configurations
**Cert_NTP: (We need this router to have the correct time since it is going to be the NTP server)**

{% highlight text %}
Cert_NTP# clock set 00:01:00 01 March 2013  // with appropriate date and time
    Cert_NTP(config)# ntp master 1
    Cert_NTP(config)# ntp authentication-key 1 md5 cisco123
    Cert_NTP(config)# ntp trusted-key 1
    Cert_NTP(config)# ntp authenticate
{% endhighlight %}

In this lab, 3 devices will be using RSA-Signatures - R2, R3 and ASA1. All these devices will need to use the NTP Server to set the time.

**AT R2 and R3:**
{% highlight text %}
RX(config)#ntp server 30.1.1.5
RX(config)#ntp authentication-key 1 md5 cisco123
RX(config)#ntp trusted-key 1
RX(config)#ntp authenticate
{% endhighlight %}

**AT ASA1:**
{% highlight text %}
ASA1(config)#ntp server 20.1.1.5
ASA1(config)#ntp authentication-key 1 md5 cisco123
ASA1(config)#ntp trusted-key 1
ASA1(config)#ntp authenticate
{% endhighlight %}

At this point, ASA1 and R2 will successfully communicate with NTP Server and will be on the way to synchronizing, but R3 will have trouble communicating with NTP server due it being on the OUTSIDE interface of ASA2. NTP communicated on UDP port 123. We will have to open an ACL for the same.

{% highlight text %}
ASA2(config)#access-list OUT_IN extended permit udp host 50.1.1.1 host 30.1.1.5 eq ntp
ASA2(config)#access-group OUT_IN in interface OUTSIDE
{% endhighlight %}

AT this point, NTP configurations are all over! The clocks may not have yet synchronized because NTP takes a lot of time to synchronize. As a hack use the following command on all the 3 device to set the current time (with appropriate date and time):

{% highlight text %}
XXX# clock set 00:01:00 01 March 2013
{% endhighlight %}

# Certificate Configurations:
Since we are using RSA-Sig in this lab, we will make a Certificate Authority server to issue new certificates. In this example, Cert_NTP will be configured.

**Certificate Server**
{% highlight text %}
Cert_NTP(config)# ip http server // RSA-Sig certificates will be requested over http
Cert_NTP(config)# crypto key generate rsa modulous 1024
Cert_NTP(config)# crypto pki server CA_Server
    Cert_NTP(cs-server)# issuer-name CN=ca_server OU=cisco C=India S=Karnataka L=Bangalore
    Cert_NTP(cs-server)# lifetime ca_certificate 3
    Cert_NTP(cs-server)# lifetime certificate 2
    Cert_NTP(cs-server)# grant auto
    Cert_NTP(cs-server)# database level minimum
    Cert_NTP(cs-server)# no shutdown // Enable the Server
{% endhighlight %}

At this point, it will ask for a Password and re confirm the same.

**Certificate Client (R2 and R3)**
{% highlight text %}
Rx(config)# crypto pki trustpoint CA_Server
    Rx(cs-trustpoint)# enrollment url http://30.1.1.5
    Rx(cs-trustpoint)# revocation-check none
Rx(config)# crypto pki authenticate CA_Server  // At this point it will show you the hashes (fingerprints) and ask if you want to accept it! Please accept!
    Rx(config)# crypto pki enroll CA_Server // At this point, it will ask for a password and then take you through a Yes/No questions. After you answer them, the certificates will be issued
{% endhighlight %}

Again we will have trouble with ASA. Since the certificate communication between Client and server happens over http, the http connection initiated from R3 will be blocked by ASA. So please use the following command to open port 80.
{% highlight text %}
ASA(config)#access-list OUT_IN extended permit tcp host 50.1.1.1 host 30.1.1.5 eq www // Since OUT_IN has already been applied the last time, we do not need to use access-group again!
{% endhighlight %}

**Certificate Client (ASA)**
{% highlight text %}
ASA1(config)# crypto ca trustpoint CA_Server
    Rx(cs-trustpoint)# enrollment url http://20.1.1.5
    Rx(cs-trustpoint)# revocation-check none
Rx(config)# crypto ca authenticate CA_Server  // At this point it will show you the hashes (fingerprints) and ask if you want to accept it! Please accept!
    Rx(config)# crypto ca enroll CA_Server // At this point, it will ask for a password and then take you through a Yes/No questions. After you answer them, the certificates will be issued.
{% endhighlight %}

At this point, we must have the certificates on all the device and ready to configure VPN!

#VPN Configuration R2 and ASA
Interesting Traffic: 1.1.1.1 <---> 2.2.2.2

**On R2: (Regular VPN Config)**
{% highlight text %}
R2(config)# access-list 101 permit ip host 2.2.2.2 host 1.1.1.1
R2(config)# crypto isakmp policy 10
    R2(config-isakmp)# authentication rsa-sig [Default]
    R2(config-isakmp)# encryption 3DES
    R2(config-isakmp)# hash sha
    R2(config-isakmp)# group 1
R2(config)# crypto ipsec transform-set TSET esp-3des esp-sha-hmac
R2(config)# crypto map CMAP 10 ipsec-isakmp
R2(config-crypto-map)# set transform-set TSET
R2(config-crypto-map)# set peer 20.1.1.10
R2(config-crypto-map)# match address 101
R2(config)# int f0/0
R2(config-if)# crypto map CMAP
{% endhighlight %}

**On ASA:**
{% highlight text %}
ASA1(config)# access-list 101 permit ip host 1.1.1.1 host 2.2.2.2
ASA1(config)# crypto isakmp policy 10
    ASA1(config-isakmp)# authentication rsa-sig
    ASA1(config-isakmp)# encryption 3DES
    ASA1(config-isakmp)# hash sha
    ASA1(config-isakmp)# group 1
ASA1(config)# crypto ipsec transform-set TSET esp-3des esp-sha-hmac
ASA1(config)# tunnel-group 40.1.1.1 type ipsec-l2l
ASA1(config)# tunnel-group 40.1.1.1 ipsec-attributes
    ASA1(config-tunnel-ipsec)# peer-id-validate nocheck // Required while creating VPN between Router and ASA using RSA Certificate Authentication
    ASA1(config-tunnel-ipsec)# trustpoint CA_Server // Required for Certificate Authentication
ASA1(config)# crypto map CMAP 10 set transform-set TSET
ASA1(config)# crypto map CMAP 10 set peer 40.1.1.1
ASA1(config)# crypto map CMAP 10 match address 101
ASA1(config)# crypto map CMAP 10 set trustpoint CA_Server // Required if you have to initiate traffic from ASA's side
ASA1(config)# crypto map CMAP interface OUTSIDE
ASA1(config)# crypto isakmp enable OUTSIDE
{% endhighlight %}

Rememeber for VPN the 2 critical protocol/ports are ESP and UDP 500. Now if we initiate traffic from Loopback of R2 to Loopback of R1, UDP is inspected and hence will return back. ESP will go from R2 to ASA1, but will not return back. Hence we have to open an ACL for coming from DMZ to INSIDE.

{% highlight text %}
ASA2(config)#access-list DMZ_IN extended permit esp host 20.1.1.10 host 40.1.1.1
ASA2(config)#access-group DMZ_IN in interface DMZ
{% endhighlight %}

But since we need to be able to initiate traffic from R1's loopback too, we have to create an ACL for UDP 500
{% highlight text %}
ASA2(config)#access-list DMZ_IN extended permit udp host 20.1.1.10 eq isakmp host 40.1.1.1 eq isakmp
{% endhighlight %}

#VPN Configuration R3 and ASA
Interesting Traffic: 1.1.1.1 <---> 3.3.3.3

Router and ASA configurations are the same except for the the different IP Address according to this setup. But in this case if we were to initiate traffic from R3 to R1, we have to create ACL for both ESP and ISAKMP (UDP 500) from OUTSIDE to DMZ. We make use of the same ACL OUT_IN used previously.

{% highlight text %}
ASA2(config)#access-list OUT_IN extended permit esp host 50.1.1.1 host 20.1.1.10
ASA2(config)#access-list OUT_IN extended permit udp host 50.1.1.1 eq isakmp host 20.1.1.10 eq isakmp
{% endhighlight %}

But even from DMZ to OUT will be blocked due to the explicit deny of the ACL 'DMZ_IN'. So let us add to that ACL

{% highlight text %}
ASA2(config)#access-list DMZ_IN extended permit esp host 20.1.1.10 host 50.1.1.1
ASA2(config)#access-list DMZ_IN extended permit udp host 20.1.1.10 eq isakmp host 50.1.1.1 eq isakmp
{% endhighlight %}

At this point, the VPN between R2 and R1 and R3 and R1 will be successful!!!

**HairPinning**
Hairpinning is the method of using tunnels from R2 to ASA and R3 to ASA, to communicate between R2 and R3 Loopbacks~! We have to add one Crypto ACL's in R2 and R3. We have to add 2 crypto ACL to ASA as mentioned below:
{% highlight text %}
R2(config)# access-list 101 permit ip host 2.2.2.2 host 3.3.3.3
R3(config)# access-list 101 permit ip host 3.3.3.3 host 2.2.2.2
{% endhighlight %}

In ASA be careful to update the existing ACLs such that the new ASA of the same number has a different source but same destination (as given below)!
{% highlight text %}
ASA1(config)# access-list 101 permit ip host 1.1.1.1 host 2.2.2.2 [Existing]
ASA1(config)# access-list 101 permit ip host 3.3.3.3 host 2.2.2.2
ASA1(config)# access-list 102 permit ip host 1.1.1.1 host 3.3.3.3 [Existing]
ASA1(config)# access-list 102 permit ip host 2.2.2.2 host 3.3.3.3
{% endhighlight %}

At this point if you try pinging from the loopback of R2 to loopback of R3, it will create SAs, but the ping will not happen!!! This is due to the fact that ASA's will not by default let SAME SECURITY LEVEL TRAFFIC! Use the following command:

```
ASA1(config)# same-security-traffic permit intra-interface
```
