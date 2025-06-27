---
layout: post
title: GRE over IPSec
categories: [Network Security]
tags: [security]
description: This is a IPSec VPN Tunnel over GRE tunnel
---

| IP Header | ESP | IP Header | GRE | IP Header | TCP/UDP | Data |

* Compared to regular IPSec, we waste 20bytes (IP Header) and 4bytes (GRE)
* To save 20bytes (IP Header) , we can make use of the Transport Mode which will just COPY the IP header over instead of creating new IP Header
* To save even the the extra 4 bytes (GRE), make the tunnel mode as IPSEC
  * Command:
    ```
    (config-if)# tunnel mode ipsec ipv4
    ```

* Different way of giving ISAKMP KEY is using KEY RING
  * Command:
    {% highlight text %}
    * (config)# crypto keyring <_____>
      * (config-keyring)# preshared key address <peer ip><mask> key 0 <key>
    * (config)# crypto isakmp-profile <_____>
      * (isakmp-profile)# keyring <_____>
      * (isakmp-profile)# match identity address <peer address>
    * (config)# crypto ipsec-profile <______>
      * (ipsec-profile)# set isakmp-profile <____>
    * (config)# interface tunnel 0
      * (config-if)# tunnel protection ipsec profile <_____>
  {% endhighlight %}

The GRE tunnel keepalive mechanism is slightly different than for Ethernet or serial interfaces. It gives the ability for one side to originate and receive keepalive packets to and from a remote router even if the remote router does not support GRE keepalives. Since GRE is a packet tunneling mechanism for tunneling IP inside IP, a GRE IP tunnel packet can be built inside another GRE IP tunnel packet. For GRE keepalives, the sender pre-builds the keepalive response packet inside the original keepalive request packet so that the remote end only needs to do standard GRE decapsulation of the outer GRE IP header and then forward the inner IP GRE packet. This mechanism causes the keepalive response to forward out the physical interface rather than the tunnel interface. This means that the GRE keepalive response packet is not affected by any output features on the tunnel interface, such as 'tunnel protection ...', QoS, and so forth. ).

## GRE OVER IPSEC

{% highlight text %}
R1#
crypto ipsec transform-set tset esp-3des esp-md5-hmac

crypto ipsec profile IPSEC-PROFILE                                       //for tunnel protection
set transform-set tset

interface Tunnel1
tunnel protection ipsec profile IPSEC-PROFILE
R2#
crypto ipsec transform-set tset esp-3des esp-md5-hmac

crypto ipsec profile IPSEC-PROFILE
set transform-set tset

interface Tunnel1
tunnel protection ipsec profile IPSEC-PROFILE
{% endhighlight %}

<b>After IPSEC profile is applied to tunnel0 all data will be protected</b>

![b]({{site.url}}/img/b.png)

GRE without IPSEC in transport mode

![c]({{site.url}}/img/c.png)
![d]({{site.url}}/img/d.png)

GRE with IPSEC in transport mode

![e]({{site.url}}/img/e.png)
![f]({{site.url}}/img/f.png)

<b>Verification:</b>
{% highlight text %}
Sh crypto isakmp sa
Sh crypto isakmp sa  details
Sh crypto ipsec sa
Sh inter tunnel 0
Sh ip route
R1#
crypto ipsec transform-set tset esp-3des esp-md5-hmac

crypto ipsec profile IPSEC-PROFILE                                       //for tunnel protection
set transform-set tset

interface Tunnel1
tunnel protection ipsec profile IPSEC-PROFILE
R2#
crypto ipsec transform-set tset esp-3des esp-md5-hmac

crypto ipsec profile IPSEC-PROFILE
set transform-set tset

interface Tunnel1
tunnel protection ipsec profile IPSEC-PROFILE
{% endhighlight %}

<b>After IPSEC profile is applied to tunnel0 all data will be protected</b>

![g]({{site.url}}/img/g.png)

## Task

![h]({{site.url}}/img/h.png)

Step 1: No Access List
Step 2: ISAKMP Policy   
* (config)# crypto isakmp policy 10
    * (config-policy)# authentication pre-share
Step 3: ISAKMP Key
* (config)#crypto isakmp key 0 cisco address 20.1.1.1
Step 4: IPSEC Transform Set
* (config)# crypto ipsec transform-set GSET esp-3des esp-sha-hmac
Step 5: IPSEC Profile
* (config)# crypto ipsec profile GRE_IPSEC
    * (config-profile)# set transform-set GSET
Step 6: Apply to the interface
* (config)# interface tunnel 0
    * (config-if)# tunnel protection ipsec profile GRE_IPSEC

<b>GRE Over IPsec with AH - Transport Mode</b>

![i]({{site.url}}/img/i.png)

<b>GRE Over IPsec with AH - Tunnel Mode</b>
![j]({{site.url}}/img/j.png)
