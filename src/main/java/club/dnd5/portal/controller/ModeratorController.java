package club.dnd5.portal.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import club.dnd5.portal.model.Alignment;
import club.dnd5.portal.model.CreatureSize;
import club.dnd5.portal.model.CreatureType;
import club.dnd5.portal.model.DamageType;
import club.dnd5.portal.model.creature.Condition;

@Controller
public class ModeratorController {
	@GetMapping ("/profile/beast")
	public String getProfileForm(Model model) {
		model.addAttribute("sizes", CreatureSize.values());
		model.addAttribute("types", CreatureType.values());
		model.addAttribute("aligments", Alignment.values());
		model.addAttribute("resistancs", DamageType.getResistance());
		model.addAttribute("resistancs", DamageType.getImmunity());
		model.addAttribute("vulnerabilities", DamageType.getVulnerability());
		model.addAttribute("conditionImmunity", Condition.values());
		return "user/admin/add_beast";
	}
}