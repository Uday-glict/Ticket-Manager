import asyncio, httpx, uuid, io
from PIL import Image
BASE="http://127.0.0.1:8002"
def png():
    img=Image.new("RGB",(50,50),color=(0,0,255))
    b=io.BytesIO(); img.save(b,format="PNG"); return b.getvalue()
async def test():
    async with httpx.AsyncClient() as client:
        # owner signup
        e_owner=f"own_{uuid.uuid4().hex[:6]}@example.com"
        r=await client.post(f"{BASE}/api/v1/auth/signup", json={"email":e_owner,"password":"TestPass123!","name":"Owner"})
        token_owner=r.json()["data"]["access_token"]
        uid_owner=r.json()["data"]["user"]["id"]
        h_owner={"Authorization": f"Bearer {token_owner}"}
        print("owner signup",r.status_code)
        # create member with avatar via owner
        e_mem=f"mem_{uuid.uuid4().hex[:6]}@example.com"
        files={"avatar": ("a.png", png(), "image/png")}
        data={"email":e_mem,"password":"MemberPass123!","name":"Member"}
        r2=await client.post(f"{BASE}/api/v1/users", headers=h_owner, data=data, files=files)
        print("create member with avatar",r2.status_code, r2.text[:500])
        mem_id=r2.json()["data"]["id"] if r2.status_code==201 else None
        # create project by owner
        r3=await client.post(f"{BASE}/api/v1/projects", headers=h_owner, json={"name":"Proj1","description":"desc"})
        print("create project",r3.status_code, r3.text[:400])
        proj_id=r3.json()["data"]["id"] if r3.status_code in (200,201) else None
        if proj_id and mem_id:
            # need role id for member: fetch roles
            r_roles=await client.get(f"{BASE}/api/v1/roles", headers=h_owner)
            roles=r_roles.json()["data"]
            role_id=roles[0]["id"] if roles else None
            if role_id:
                r_add=await client.post(f"{BASE}/api/v1/projects/{proj_id}/members", headers=h_owner, json={"user_id":mem_id,"role_id":role_id})
                print("add member",r_add.status_code, r_add.text[:300])
        # login as member
        r_login=await client.post(f"{BASE}/api/v1/auth/login", json={"email":e_mem,"password":"MemberPass123!"})
        print("member login",r_login.status_code)
        token_mem=r_login.json()["data"]["access_token"] if r_login.status_code==200 else None
        h_mem={"Authorization": f"Bearer {token_mem}"} if token_mem else {}
        # member tries to list users -> should be 403
        r_u=await client.get(f"{BASE}/api/v1/users", headers=h_mem)
        print("member list users",r_u.status_code, r_u.text[:300])
        # member list projects -> should be filtered (only Proj1)
        r_p=await client.get(f"{BASE}/api/v1/projects", headers=h_mem)
        print("member list projects",r_p.status_code, r_p.json()["data"][0]["name"] if r_p.status_code==200 and r_p.json()["data"] else r_p.text[:300])
        # member tries to get project they are not member of (create second project not added)
        r3b=await client.post(f"{BASE}/api/v1/projects", headers=h_owner, json={"name":"Proj2","description":"desc2"})
        proj2=r3b.json()["data"]["id"] if r3b.status_code in (200,201) else None
        if proj2:
            r_get2=await client.get(f"{BASE}/api/v1/projects/{proj2}", headers=h_mem)
            print("member get proj2 (not member)",r_get2.status_code, r_get2.text[:400])
        # member tries to create project -> should be allowed now? we allowed projects.create for any member, so 200/201
        r_create2=await client.post(f"{BASE}/api/v1/projects", headers=h_mem, json={"name":"MemberProj","description":"x"})
        print("member create project",r_create2.status_code, r_create2.text[:300])
        # owner list users -> 200
        r_u2=await client.get(f"{BASE}/api/v1/users", headers=h_owner)
        print("owner list users",r_u2.status_code, "total", r_u2.json()["pagination"]["total"])
asyncio.run(test())
